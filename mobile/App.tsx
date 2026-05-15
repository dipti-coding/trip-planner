import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const API_BASE = 'http://localhost:8000';

type Trip = {
  id: string;
  name: string;
  destination_city: string;
  start_date: string;
  end_date: string;
};

type Plan = {
  id: string;
  type: string;
  title: string;
  start_datetime: string | null;
};

export default function App() {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/trips`)
      .then(res => res.json())
      .then((trips: Trip[]) => {
        if (trips.length === 0) {
          setError('No trips found — run just seed');
          return;
        }
        const first = trips[0];
        setTrip(first);
        return fetch(`${API_BASE}/trips/${first.id}/plans`);
      })
      .then(res => res?.json())
      .then((data: Plan[]) => data && setPlans(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {trip && (
        <View style={styles.tripHeader}>
          <Text style={styles.tripName}>{trip.name}</Text>
          <Text style={styles.tripMeta}>{trip.destination_city}</Text>
          <Text style={styles.tripMeta}>
            {trip.start_date} → {trip.end_date}
          </Text>
        </View>
      )}
      <FlatList
        data={plans}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.planCard}>
            <Text style={styles.planType}>{item.type}</Text>
            <Text style={styles.planTitle}>{item.title}</Text>
            {item.start_datetime && (
              <Text style={styles.planTime}>
                {new Date(item.start_datetime).toLocaleString()}
              </Text>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f2f2f7'},
  centered: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  tripHeader: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tripName: {fontSize: 22, fontWeight: '700', marginBottom: 4},
  tripMeta: {fontSize: 14, color: '#666', marginTop: 2},
  planCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    padding: 16,
  },
  planType: {fontSize: 11, fontWeight: '600', color: '#007AFF', textTransform: 'uppercase', marginBottom: 4},
  planTitle: {fontSize: 16, fontWeight: '500'},
  planTime: {fontSize: 13, color: '#888', marginTop: 4},
  error: {fontSize: 14, color: '#FF3B30'},
});
