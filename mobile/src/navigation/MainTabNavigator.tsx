import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CommunitiesStack } from './CommunitiesStack';
import { HomeStack } from './HomeStack';
import { SupportScreen } from '../screens/SupportScreen';
import { CreatePostScreen } from '../screens/CreatePostScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CustomTabBar } from './CustomTabBar';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Communities" component={CommunitiesStack} />
      <Tab.Screen name="Post" component={CreatePostScreen} />
      <Tab.Screen name="Support" component={SupportScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
