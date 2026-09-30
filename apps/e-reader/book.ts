export type Chapter = {
  title: string;
  subtitle: string;
  paragraphs: string[];
};

// Original sample text keeps the demo usable offline and safe to narrate.
export const BOOK = {
  title: 'The Quiet Atlas',
  author: 'A story for slow mornings',
  chapters: [
    {
      title: 'The First Light',
      subtitle: 'Every map begins somewhere.',
      paragraphs: [
        'At the edge of the city, where the last streetlamp gave way to fields, Mara found a small blue notebook. Its cover was soft from years of being carried, and its pages smelled faintly of rain. Inside were drawings of places she had never seen, each one marked with a single silver star.',
        'The first drawing showed a house beside a river. A line of handwritten text ran beneath it: Begin where the water remembers your name. Mara read the words twice. The river near her childhood home had long since been hidden beneath a road, but she could still hear it in her dreams.',
        'She placed the notebook in her coat and started walking. Morning opened slowly around her. Shop windows caught the pale gold sky, birds gathered on the telephone wires, and for the first time in years she was going somewhere without knowing exactly why.',
      ],
    },
    {
      title: 'A River Under the Road',
      subtitle: 'Some places wait to be found.',
      paragraphs: [
        'By noon, Mara reached the old stone bridge. Cars passed above it now, and most people crossed without noticing the narrow path below. She followed that path until the traffic softened into a distant hum and the sound of moving water took its place.',
        'The river was smaller than she remembered. It curved between reeds and smooth black stones, carrying fallen leaves toward the sea. On the far bank stood the house from the notebook, its windows bright in the afternoon sun. Someone had planted white flowers all along the steps.',
        'Mara opened the blue cover again. The silver star on the page seemed less like a destination than an invitation. She crossed the bridge slowly, letting the sound of the water set the pace.',
      ],
    },
    {
      title: 'The Shape of Home',
      subtitle: 'The way forward can feel familiar.',
      paragraphs: [
        'An elderly woman answered the door before Mara could knock. She looked at the notebook, then at Mara, and smiled as if they were continuing a conversation begun long ago. There was tea on the table and a second cup already waiting.',
        'They spoke until the light changed. The woman told stories of travelers who had followed the little atlas: a painter searching for a color, a brother trying to find his sister, a child who simply wanted to know what lay beyond the hill. Each had added a drawing before passing it on.',
        'That evening, Mara drew the river as she had seen it: modest, bright, and still moving. Beneath the picture she wrote, Listen closely. The world is always telling you where to begin. Then she closed the notebook and watched the first stars appear.',
      ],
    },
  ] as Chapter[],
};
