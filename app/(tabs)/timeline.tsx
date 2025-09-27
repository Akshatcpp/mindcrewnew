import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, TrendingUp, Filter } from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface Symptom {
  id: string;
  name: string;
  severity: number;
  duration: string;
  description: string;
  timestamp: Date;
  type: 'text' | 'voice' | 'image';
}

export default function TimelineScreen() {
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    loadSymptoms();
  }, []);

  const loadSymptoms = async () => {
    try {
      const data = await AsyncStorage.getItem('symptoms');
      if (data) {
        const parsedSymptoms = JSON.parse(data).map((s: any) => ({
          ...s,
          timestamp: new Date(s.timestamp)
        }));
        setSymptoms(parsedSymptoms);
      }
    } catch (error) {
      console.error('Error loading symptoms:', error);
    }
  };

  const getFilteredSymptoms = () => {
    const now = new Date();
    const cutoff = new Date();
    
    switch (selectedPeriod) {
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setDate(now.getDate() - 30);
        break;
      default:
        cutoff.setFullYear(2020); // Show all
    }
    
    return symptoms.filter(s => s.timestamp >= cutoff);
  };

  const getChartData = () => {
    const filteredSymptoms = getFilteredSymptoms();
    const days = selectedPeriod === 'week' ? 7 : 30;
    const labels = [];
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const daySymptoms = filteredSymptoms.filter(s => 
        s.timestamp.toDateString() === date.toDateString()
      );
      
      labels.push(date.getDate().toString());
      const avgSeverity = daySymptoms.length > 0 
        ? daySymptoms.reduce((sum, s) => sum + s.severity, 0) / daySymptoms.length
        : 0;
      data.push(avgSeverity);
    }
    
    return { labels, datasets: [{ data }] };
  };

  const getSymptomsByDate = () => {
    const filteredSymptoms = getFilteredSymptoms();
    const groupedSymptoms: { [key: string]: Symptom[] } = {};
    
    filteredSymptoms.forEach(symptom => {
      const dateKey = symptom.timestamp.toDateString();
      if (!groupedSymptoms[dateKey]) {
        groupedSymptoms[dateKey] = [];
      }
      groupedSymptoms[dateKey].push(symptom);
    });
    
    return Object.entries(groupedSymptoms)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());
  };

  const getSeverityColor = (severity: number) => {
    const colors = ['#10B981', '#F59E0B', '#EF4444', '#DC2626', '#991B1B'];
    return colors[severity - 1] || '#6B7280';
  };

  const getSeverityLabel = (severity: number) => {
    const labels = ['Mild', 'Moderate', 'Severe', 'Very Severe', 'Extreme'];
    return labels[severity - 1] || 'Unknown';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Symptom Timeline</Text>
            <Text style={styles.subtitle}>Track your health patterns</Text>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'all'] as const).map(period => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodText,
                selectedPeriod === period && styles.periodTextActive
              ]}>
                {period === 'week' ? '7 Days' : period === 'month' ? '30 Days' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <TrendingUp size={20} color="#4F46E5" />
            <Text style={styles.chartTitle}>Average Symptom Severity</Text>
          </View>
          
          {symptoms.length > 0 ? (
            <LineChart
              data={getChartData()}
              width={width - 60}
              height={200}
              chartConfig={{
                backgroundColor: '#FFFFFF',
                backgroundGradientFrom: '#FFFFFF',
                backgroundGradientTo: '#FFFFFF',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: '#4F46E5'
                }
              }}
              style={styles.chart}
              bezier
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Calendar size={32} color="#D1D5DB" />
              <Text style={styles.noDataText}>No symptom data yet</Text>
              <Text style={styles.noDataSubtext}>Start logging symptoms to see trends</Text>
            </View>
          )}
        </View>

        {/* Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Recent Activity</Text>
          
          {getSymptomsByDate().length > 0 ? (
            getSymptomsByDate().map(([date, daySymptoms], index) => (
              <View key={date} style={styles.dayGroup}>
                <Text style={styles.dateLabel}>{formatDate(date)}</Text>
                
                {daySymptoms.map(symptom => (
                  <View key={symptom.id} style={styles.symptomItem}>
                    <View style={[
                      styles.severityDot,
                      { backgroundColor: getSeverityColor(symptom.severity) }
                    ]} />
                    
                    <View style={styles.symptomContent}>
                      <View style={styles.symptomHeader}>
                        <Text style={styles.symptomName}>{symptom.name}</Text>
                        <Text style={styles.symptomTime}>{formatTime(symptom.timestamp)}</Text>
                      </View>
                      
                      <View style={styles.symptomMeta}>
                        <View style={[
                          styles.severityBadge,
                          { backgroundColor: getSeverityColor(symptom.severity) + '20' }
                        ]}>
                          <Text style={[
                            styles.severityBadgeText,
                            { color: getSeverityColor(symptom.severity) }
                          ]}>
                            {getSeverityLabel(symptom.severity)}
                          </Text>
                        </View>
                        
                        {symptom.duration && (
                          <Text style={styles.durationText}>Duration: {symptom.duration}</Text>
                        )}
                      </View>
                      
                      {symptom.description && (
                        <Text style={styles.symptomDescription} numberOfLines={2}>
                          {symptom.description}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ))
          ) : (
            <View style={styles.noDataContainer}>
              <Calendar size={32} color="#D1D5DB" />
              <Text style={styles.noDataText}>No recent activity</Text>
              <Text style={styles.noDataSubtext}>Start logging symptoms to build your timeline</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  filterButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  periodTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  dayGroup: {
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 12,
  },
  symptomItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  severityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  symptomContent: {
    flex: 1,
  },
  symptomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  symptomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  symptomTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  symptomMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 12,
  },
  severityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  durationText: {
    fontSize: 12,
    color: '#6B7280',
  },
  symptomDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});