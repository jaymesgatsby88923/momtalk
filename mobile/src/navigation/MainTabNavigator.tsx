import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CommunitiesScreen } from '../screens/CommunitiesScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
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
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Communities" component={CommunitiesScreen} />
      <Tab.Screen name="Post" component={CreatePostScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
