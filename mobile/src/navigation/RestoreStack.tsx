import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { JournalEntryDetailScreen } from '../screens/JournalEntryDetailScreen';
import { RestoreJournalScreen } from '../screens/RestoreJournalScreen';
import { RestoreScreen } from '../screens/RestoreScreen';
import { RestoreStackParamList } from './types';

const Stack = createNativeStackNavigator<RestoreStackParamList>();

export function RestoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RestoreHome" component={RestoreScreen} />
      <Stack.Screen name="RestoreJournal" component={RestoreJournalScreen} />
      <Stack.Screen name="JournalEntryDetail" component={JournalEntryDetailScreen} />
    </Stack.Navigator>
  );
}
