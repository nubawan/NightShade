declare module 'react-native-vector-icons/MaterialCommunityIcons' {
  import { ComponentType } from 'react';
  import { IconProps } from 'react-native-vector-icons/Icon';
  const MaterialCommunityIcons: ComponentType<IconProps>;
  export default MaterialCommunityIcons;
}
declare module 'react-native-vector-icons/Icon' {
  import { ComponentType } from 'react';
  interface IconProps {
    name: string;
    size: number;
    color?: string;
    style?: any;
  }
  const Icon: ComponentType<IconProps>;
  export default Icon;
}
