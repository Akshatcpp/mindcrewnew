import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  ExternalLink,
  Stethoscope,
  Pill
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'urgent';
  category: 'lifestyle' | 'medical' | 'monitoring' | 'emergency';
  action?: string;
  symptoms: string[];
  timestamp: Date;
}

interface Symptom {
  id: string;
  name: string;
  severity: number;
  duration: string;
  description: string;
  timestamp: Date;
  type: 'text' | 'voice' | 'image';
}

export default function SuggestionsScreen() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const symptomsData = await AsyncStorage.getItem('symptoms');
      if (symptomsData) {
        const parsedSymptoms = JSON.parse(symptomsData).map((s: any) => ({
          ...s,
          timestamp: new Date(s.timestamp)
        }));
        setSymptoms(parsedSymptoms);
        generateSuggestions(parsedSymptoms);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const generateSuggestions = (symptoms: Symptom[]) => {
    const recentSymptoms = symptoms.filter(s => {
      const daysSince = (Date.now() - s.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7; // Last 7 days
    });

    const generatedSuggestions: Suggestion[] = [];

    // Rule-based suggestion generation
    const symptomNames = recentSymptoms.map(s => s.name.toLowerCase());
    const maxSeverity = Math.max(...recentSymptoms.map(s => s.severity), 0);

    // Headache rules
    if (symptomNames.includes('headache')) {
      const headacheSymptoms = recentSymptoms.filter(s => s.name.toLowerCase().includes('headache'));
      const avgSeverity = headacheSymptoms.reduce((sum, s) => sum + s.severity, 0) / headacheSymptoms.length;

      if (avgSeverity >= 4) {
        generatedSuggestions.push({
          id: 'headache-severe',
          title: 'Severe Headache Monitoring',
          description: 'Your headache severity is concerning. Consider seeing a healthcare provider if symptoms persist or worsen.',
          severity: 'high',
          category: 'medical',
          action: 'Schedule doctor appointment',
          symptoms: ['headache'],
          timestamp: new Date(),
        });
      } else {
        generatedSuggestions.push({
          id: 'headache-mild',
          title: 'Headache Management',
          description: 'Try staying hydrated, resting in a quiet dark room, and applying a cold compress to your forehead.',
          severity: 'low',
          category: 'lifestyle',
          symptoms: ['headache'],
          timestamp: new Date(),
        });
      }
    }

    // Fever rules
    if (symptomNames.includes('fever')) {
      generatedSuggestions.push({
        id: 'fever-monitoring',
        title: 'Fever Monitoring Required',
        description: 'Monitor your temperature regularly and stay hydrated. Seek medical attention if fever exceeds 103°F (39.4°C).',
        severity: 'medium',
        category: 'monitoring',
        action: 'Monitor temperature',
        symptoms: ['fever'],
        timestamp: new Date(),
      });
    }

    // Multiple severe symptoms
    if (maxSeverity >= 4 && recentSymptoms.length >= 3) {
      generatedSuggestions.push({
        id: 'multiple-severe',
        title: 'Multiple Severe Symptoms',
        description: 'You have multiple symptoms with high severity. Consider consulting a healthcare professional for proper evaluation.',
        severity: 'urgent',
        category: 'emergency',
        action: 'Seek medical attention',
        symptoms: symptomNames,
        timestamp: new Date(),
      });
    }

    // Pain management
    if (symptomNames.some(s => s.includes('pain') || s.includes('ache'))) {
      generatedSuggestions.push({
        id: 'pain-management',
        title: 'Pain Management Tips',
        description: 'Apply heat/cold therapy, gentle stretching, and over-the-counter pain relievers as appropriate.',
        severity: 'low',
        category: 'lifestyle',
        symptoms: symptomNames.filter(s => s.includes('pain') || s.includes('ache')),
        timestamp: new Date(),
      });
    }

    // General wellness
    if (recentSymptoms.length > 0) {
      generatedSuggestions.push({
        id: 'general-wellness',
        title: 'General Wellness',
        description: 'Focus on adequate sleep, balanced nutrition, regular hydration, and stress management.',
        severity: 'low',
        category: 'lifestyle',
        symptoms: [],
        timestamp: new Date(),
      });
    }

    // Default suggestions if no symptoms
    if (recentSymptoms.length === 0) {
      generatedSuggestions.push({
        id: 'preventive-care',
        title: 'Preventive Health Care',
        description: 'Great job staying healthy! Continue with regular exercise, balanced diet, and adequate sleep.',
        severity: 'low',
        category: 'lifestyle',
        symptoms: [],
        timestamp: new Date(),
      });
    }

    setSuggestions(generatedSuggestions);
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'urgent':
        return {
          color: '#DC2626',
          backgroundColor: '#FEE2E2',
          icon: AlertTriangle,
          label: 'Urgent',
        };
      case 'high':
        return {
          color: '#EF4444',
          backgroundColor: '#FEF2F2',
          icon: AlertTriangle,
          label: 'High Priority',
        };
      case 'medium':
        return {
          color: '#F59E0B',
          backgroundColor: '#FFFBEB',
          icon: Info,
          label: 'Medium Priority',
        };
      default:
        return {
          color: '#10B981',
          backgroundColor: '#ECFDF5',
          icon: CheckCircle,
          label: 'Low Priority',
        };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'medical':
        return Stethoscope;
      case 'emergency':
        return AlertTriangle;
      case 'monitoring':
        return Info;
      default:
        return Lightbulb;
    }
  };

  const handleSuggestionAction = (suggestion: Suggestion) => {
    if (suggestion.action) {
      Alert.alert(
        suggestion.title,
        `Recommended action: ${suggestion.action}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Mark as Done', onPress: () => markAsDone(suggestion.id) },
          { text: 'Learn More', onPress: () => showMoreInfo(suggestion) },
        ]
      );
    } else {
      showMoreInfo(suggestion);
    }
  };

  const markAsDone = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    Alert.alert('Success', 'Suggestion marked as completed!');
  };

  const showMoreInfo = (suggestion: Suggestion) => {
    const moreInfo = getDetailedInfo(suggestion);
    Alert.alert(suggestion.title, moreInfo);
  };

  const getDetailedInfo = (suggestion: Suggestion): string => {
    switch (suggestion.id) {
      case 'headache-severe':
        return 'Severe headaches can indicate various conditions. Watch for:\n\n• Sudden onset of worst headache ever\n• Headache with fever, stiff neck\n• Changes in vision or speech\n• Weakness or numbness\n\nSeek immediate care if you experience these symptoms.';
      
      case 'fever-monitoring':
        return 'When monitoring fever:\n\n• Check temperature every 4-6 hours\n• Drink plenty of fluids\n• Rest in a cool environment\n• Take fever reducers as directed\n\nCall a doctor if fever is >103°F (39.4°C) or persists >3 days.';
      
      case 'multiple-severe':
        return 'Multiple severe symptoms may indicate:\n\n• Serious underlying condition\n• Need for comprehensive evaluation\n• Possible medication interactions\n\nDon\'t wait - seek medical attention today.';
      
      default:
        return suggestion.description + '\n\nConsult with a healthcare provider if symptoms persist or worsen.';
    }
  };

  const findNearbyPharmacy = () => {
    Alert.alert('Pharmacy Locator', 'Opening nearby pharmacy locations...');
    // In real app, integrate with Google Maps API
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Health Suggestions</Text>
            <Text style={styles.subtitle}>Personalized recommendations for you</Text>
          </View>
          <TouchableOpacity style={styles.pharmacyButton} onPress={findNearbyPharmacy}>
            <Pill size={20} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard}>
            <Stethoscope size={24} color="#4F46E5" />
            <Text style={styles.actionTitle}>Find Doctor</Text>
            <Text style={styles.actionSubtitle}>Locate nearby healthcare providers</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard} onPress={findNearbyPharmacy}>
            <Pill size={24} color="#10B981" />
            <Text style={styles.actionTitle}>Pharmacy</Text>
            <Text style={styles.actionSubtitle}>Find nearest pharmacy</Text>
          </TouchableOpacity>
        </View>

        {/* Suggestions */}
        <View style={styles.suggestionsContainer}>
          {suggestions.length > 0 ? (
            suggestions.map((suggestion) => {
              const severityConfig = getSeverityConfig(suggestion.severity);
              const CategoryIcon = getCategoryIcon(suggestion.category);
              const SeverityIcon = severityConfig.icon;

              return (
                <TouchableOpacity
                  key={suggestion.id}
                  style={[
                    styles.suggestionCard,
                    { backgroundColor: severityConfig.backgroundColor }
                  ]}
                  onPress={() => handleSuggestionAction(suggestion)}
                >
                  {/* Header */}
                  <View style={styles.suggestionHeader}>
                    <View style={styles.suggestionIcons}>
                      <CategoryIcon size={20} color={severityConfig.color} />
                      <SeverityIcon size={16} color={severityConfig.color} style={styles.severityIcon} />
                    </View>
                    <View style={[
                      styles.severityBadge,
                      { backgroundColor: severityConfig.color }
                    ]}>
                      <Text style={styles.severityBadgeText}>
                        {severityConfig.label}
                      </Text>
                    </View>
                  </View>

                  {/* Content */}
                  <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                  <Text style={styles.suggestionDescription}>
                    {suggestion.description}
                  </Text>

                  {/* Footer */}
                  <View style={styles.suggestionFooter}>
                    {suggestion.symptoms.length > 0 && (
                      <Text style={styles.relatedSymptoms}>
                        Related: {suggestion.symptoms.join(', ')}
                      </Text>
                    )}
                    
                    {suggestion.action && (
                      <View style={styles.actionContainer}>
                        <ExternalLink size={14} color={severityConfig.color} />
                        <Text style={[
                          styles.actionText,
                          { color: severityConfig.color }
                        ]}>
                          {suggestion.action}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.noSuggestionsContainer}>
              <CheckCircle size={48} color="#10B981" />
              <Text style={styles.noSuggestionsTitle}>All Clear! 🎉</Text>
              <Text style={styles.noSuggestionsText}>
                No specific health suggestions at the moment. Keep logging your symptoms for personalized recommendations.
              </Text>
            </View>
          )}
        </View>

        {/* Educational Content */}
        <View style={styles.educationalCard}>
          <Text style={styles.educationalTitle}>💡 Health Tips</Text>
          
          <View style={styles.tipItem}>
            <CheckCircle size={16} color="#10B981" />
            <Text style={styles.tipText}>
              Log symptoms consistently for better AI-powered insights
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <CheckCircle size={16} color="#10B981" />
            <Text style={styles.tipText}>
              Include severity ratings and duration for accurate suggestions
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <CheckCircle size={16} color="#10B981" />
            <Text style={styles.tipText}>
              Follow up on recommendations and track improvements
            </Text>
          </View>
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
  pharmacyButton: {
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 2,
  },
  suggestionsContainer: {
    paddingHorizontal: 20,
  },
  suggestionCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityIcon: {
    marginLeft: 8,
  },
  severityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  severityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  suggestionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  suggestionFooter: {
    gap: 8,
  },
  relatedSymptoms: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  noSuggestionsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noSuggestionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
  },
  noSuggestionsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  educationalCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  educationalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
});