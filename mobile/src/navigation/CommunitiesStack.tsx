import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CommunitiesScreen } from '../screens/CommunitiesScreen';
import { CommunityDetailScreen } from '../screens/CommunityDetailScreen';
import { PostDetailScreen } from '../screens/PostDetailScreen';
import { CommunitiesStackParamList } from './types';

const Stack = createNativeStackNavigator<CommunitiesStackParamList>();

export function CommunitiesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CommunitiesList" component={CommunitiesScreen} />
      <Stack.Screen name="CommunityDetail" component={CommunityDetailScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
    </Stack.Navigator>
  );
}
