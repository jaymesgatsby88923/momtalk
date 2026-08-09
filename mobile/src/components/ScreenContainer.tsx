import { AppScreen, AppScreenProps } from './AppScreen';

/** @deprecated Prefer AppScreen directly. Kept so existing screens pick up the shared shell. */
export type ScreenContainerProps = AppScreenProps;

export function ScreenContainer(props: ScreenContainerProps) {
  return <AppScreen {...props} />;
}
