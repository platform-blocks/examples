import assert from 'node:assert/strict';
import test from 'node:test';
import { imagePaths, parseDicom } from '../dicom.ts';
import { createFileStudy, createSampleStudy } from '../study.ts';

test('sample stack has changing scan pixels and one frame per slider position', () => {
  const study = createSampleStudy();
  assert.equal(study.frames.length, 36);
  assert.equal(study.frames[35].frame, 35);
  const image = study.images[0];
  const first = imagePaths(image, 0, 400, 40, false, 32);
  const middle = imagePaths(image, 18, 400, 40, false, 32);
  assert.notDeepEqual(first, middle);
  assert.notDeepEqual(first, imagePaths(image, 0, 400, 40, true, 32));
});

test('file instances sort numerically and flatten multi-frame images', () => {
  const base = createSampleStudy().images[0];
  const high = { ...base, frames: 2, instanceNumber: 10, seriesInstanceUid: 'series-a' };
  const low = { ...base, frames: 1, instanceNumber: 2, seriesInstanceUid: 'series-a' };
  const study = createFileStudy([{ name: '10.dcm', image: high }, { name: '2.dcm', image: low }]);
  assert.equal(study.frames.length, 3);
  assert.equal(study.frames[0].image, low);
  assert.equal(study.frames[2].frame, 1);
  assert.throws(() => createFileStudy([{ name: 'a', image: low }, { name: 'b', image: { ...high, seriesInstanceUid: 'series-b' } }]), /same image dimensions and DICOM series/);
});

test('parses a small explicit-VR monochrome DICOM and useful series metadata', () => {
  const chunks = [new Uint8Array(128), new TextEncoder().encode('DICM')];
  const field = (group, element, vr, raw) => {
    const value = typeof raw === 'string' ? new TextEncoder().encode(raw + (raw.length % 2 ? ' ' : '')) : raw;
    const long = vr === 'OW';
    const head = new ArrayBuffer(long ? 12 : 8);
    const view = new DataView(head);
    view.setUint16(0, group, true); view.setUint16(2, element, true);
    new Uint8Array(head).set(new TextEncoder().encode(vr), 4);
    if (long) view.setUint32(8, value.length, true); else view.setUint16(6, value.length, true);
    chunks.push(new Uint8Array(head), value);
  };
  const us = value => { const bytes = new Uint8Array(2); new DataView(bytes.buffer).setUint16(0, value, true); return bytes; };
  field(0x0002, 0x0010, 'UI', '1.2.840.10008.1.2.1');
  field(0x0008, 0x0060, 'CS', 'CT');
  field(0x0008, 0x103e, 'LO', 'Chest axial');
  field(0x0020, 0x0013, 'IS', '7');
  field(0x0028, 0x0002, 'US', us(1));
  field(0x0028, 0x0004, 'CS', 'MONOCHROME2');
  field(0x0028, 0x0010, 'US', us(2));
  field(0x0028, 0x0011, 'US', us(2));
  field(0x0028, 0x0100, 'US', us(16));
  field(0x0028, 0x0103, 'US', us(0));
  const sequence = new ArrayBuffer(12);
  const sequenceView = new DataView(sequence);
  sequenceView.setUint16(0, 0x0008, true); sequenceView.setUint16(2, 0x1115, true);
  new Uint8Array(sequence).set(new TextEncoder().encode('SQ'), 4);
  sequenceView.setUint32(8, 0xffffffff, true);
  chunks.push(new Uint8Array(sequence));
  const marker = (element, length) => {
    const data = new Uint8Array(8), view = new DataView(data.buffer);
    view.setUint16(0, 0xfffe, true); view.setUint16(2, element, true); view.setUint32(4, length, true);
    chunks.push(data);
  };
  marker(0xe000, 0xffffffff);
  field(0x0008, 0x1150, 'UI', '1.2.3');
  marker(0xe00d, 0);
  marker(0xe0dd, 0);
  field(0x7fe0, 0x0010, 'OW', new Uint8Array([0, 0, 100, 0, 200, 0, 255, 0]));
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const image = parseDicom(bytes.buffer);
  assert.deepEqual([image.width, image.height, image.frames], [2, 2, 1]);
  assert.deepEqual([...image.values], [0, 100, 200, 255]);
  assert.equal(image.instanceNumber, 7);
  assert.equal(image.seriesDescription, 'Chest axial');
});
