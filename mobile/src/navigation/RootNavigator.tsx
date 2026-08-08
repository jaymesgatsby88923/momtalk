import { ActivityIndicator } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../theme';
import { AuthStack } from './AuthStack';
import { MainTabNavigator } from './MainTabNavigator';

export function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <ScreenContainer centered>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </ScreenContainer>
    );
  }

  return isAuthenticated ? <MainTabNavigator /> : <AuthStack />;
}