import { Block, Icon, Text } from '@plocks/ui';

import { PROFILES } from '../data';
import { useNightfall } from '../store';
import { C, ProfileTile, useScreen } from '../ui';

/** "Who's watching?" launch screen. */
export function ProfilePicker() {
  const app = useNightfall();
  const { wide } = useScreen();
  const size = wide ? 140 : 104;
  return (
    <Block flex={1} align="center" justify="center" gap={wide ? 36 : 28} p={24}>
      <Text c={C.red} fw="900" size={wide ? 36 : 28} lts={2}>
        NIGHTFALL
      </Text>
      <Text c={C.white} size={wide ? 40 : 24}>
        Who's watching?
      </Text>
      <Block direction="row" wrap="wrap" justify="center" gap={wide ? 28 : 20} maw={wide ? 900 : 300}>
        {PROFILES.map((profile) => (
          <Block
            key={profile.id}
            align="center"
            gap={10}
            onPress={() => app.selectProfile(profile.id)}
            accessibilityRole="button"
            accessibilityLabel={`Watch as ${profile.name}`}
          >
            <ProfileTile color={profile.color} size={size} />
            <Text c={C.muted} size={wide ? 18 : 15}>
              {profile.name}
            </Text>
          </Block>
        ))}
        <Block align="center" gap={10}>
          <Block w={size} h={size} radius={size / 10} borderWidth={2} borderColor="#3A3A3A" align="center" justify="center" gap={0}>
            <Icon name="plus" size={size * 0.4} color={C.muted} />
          </Block>
          <Text c={C.muted} size={wide ? 18 : 15}>
            Add Profile
          </Text>
        </Block>
      </Block>
    </Block>
  );
}
