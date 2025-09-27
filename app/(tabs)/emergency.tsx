import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  AlertTriangle, 
  Phone, 
  MapPin, 
  FileText,
  Clock,
  User,
  Shield,
  Download,
  Send
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
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

export default function EmergencyScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [emergencyContacts] = useState<EmergencyContact[]>([
    { name: 'Dr. Sarah Johnson', relationship: 'Primary Care', phone: '555-0123' },
    { name: 'John Doe', relationship: 'Emergency Contact', phone: '555-0456' },
    { name: 'Jane Doe', relationship: 'Family', phone: '555-0789' },
  ]);

  useEffect(() => {
    loadSymptoms();
    getCurrentLocation();
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

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for emergency services.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      'Emergency Call',
      'This will call emergency services (911). Only use for life-threatening emergencies.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call Now', 
          style: 'destructive',
          onPress: () => Linking.openURL('tel:911')
        }
      ]
    );
  };

  const handleSOS = async () => {
    try {
      const report = await generateDoctorReport();
      const locationText = location 
        ? `Location: ${location.coords.latitude}, ${location.coords.longitude}`
        : 'Location: Not available';
      
      const sosMessage = `🚨 HEALTH EMERGENCY ALERT 🚨\n\n${locationText}\n\nMedical Summary:\n${report}\n\nPlease contact me immediately or send help.`;
      
      Alert.alert(
        'Send SOS Alert',
        'This will share your location and medical information with emergency contacts.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Send SOS', 
            onPress: () => Share.share({ message: sosMessage })
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to prepare SOS message');
    }
  };

  const generateDoctorReport = async (): Promise<string> => {
    const recentSymptoms = symptoms.filter(s => {
      const daysSince = (Date.now() - s.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30; // Last 30 days
    });

    if (recentSymptoms.length === 0) {
      return 'No recent symptoms logged in the past 30 days.';
    }

    let report = '📋 HEALTH SUMMARY REPORT\n';
    report += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    
    report += '🏥 RECENT SYMPTOMS (Last 30 Days):\n';
    report += '─────────────────────────────────\n';

    // Group symptoms by date
    const symptomsByDate: { [key: string]: Symptom[] } = {};
    recentSymptoms.forEach(symptom => {
      const dateKey = symptom.timestamp.toDateString();
      if (!symptomsByDate[dateKey]) {
        symptomsByDate[dateKey] = [];
      }
      symptomsByDate[dateKey].push(symptom);
    });

    // Sort dates (most recent first)
    const sortedDates = Object.keys(symptomsByDate).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    sortedDates.forEach(date => {
      const daySymptoms = symptomsByDate[date];
      report += `\n📅 ${new Date(date).toLocaleDateString()}\n`;
      
      daySymptoms.forEach(symptom => {
        const severityLabel = ['Mild', 'Moderate', 'Severe', 'Very Severe', 'Extreme'][symptom.severity - 1];
        report += `  • ${symptom.name.toUpperCase()}\n`;
        report += `    Severity: ${symptom.severity}/5 (${severityLabel})\n`;
        if (symptom.duration) {
          report += `    Duration: ${symptom.duration}\n`;
        }
        if (symptom.description) {
          report += `    Details: ${symptom.description}\n`;
        }
        report += `    Time: ${symptom.timestamp.toLocaleTimeString()}\n\n`;
      });
    });

    // Summary statistics
    const uniqueSymptoms = [...new Set(recentSymptoms.map(s => s.name))];
    const avgSeverity = recentSymptoms.reduce((sum, s) => sum + s.severity, 0) / recentSymptoms.length;
    const maxSeverity = Math.max(...recentSymptoms.map(s => s.severity));

    report += '\n📊 SUMMARY:\n';
    report += '─────────────────────────────────\n';
    report += `Total Symptoms Logged: ${recentSymptoms.length}\n`;
    report += `Unique Symptoms: ${uniqueSymptoms.length}\n`;
    report += `Symptoms: ${uniqueSymptoms.join(', ')}\n`;
    report += `Average Severity: ${avgSeverity.toFixed(1)}/5\n`;
    report += `Highest Severity: ${maxSeverity}/5\n`;

    // Red flags
    const highSeveritySymptoms = recentSymptoms.filter(s => s.severity >= 4);
    if (highSeveritySymptoms.length > 0) {
      report += '\n🚨 HIGH SEVERITY SYMPTOMS:\n';
      report += '─────────────────────────────────\n';
      highSeveritySymptoms.forEach(symptom => {
        report += `• ${symptom.name} (${symptom.severity}/5) - ${symptom.timestamp.toLocaleDateString()}\n`;
      });
    }

    report += '\n\n⚠️ This report is generated from user-logged symptoms and should not replace professional medical evaluation.';
    
    return report;
  };

  const shareReport = async () => {
    try {
      const report = await generateDoctorReport();
      await Share.share({
        message: report,
        title: 'Health Summary Report'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate report');
    }
  };

  const callContact = (phone: string, name: string) => {
    Alert.alert(
      'Call Contact',
      `Call ${name} at ${phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => Linking.openURL(`tel:${phone}`)
        }
      ]
    );
  };

  const findNearbyHospital = () => {
    if (location) {
      const { latitude, longitude } = location.coords;
      const url = `https://maps.google.com/?q=hospital+near+${latitude},${longitude}`;
      Linking.openURL(url);
    } else {
      Alert.alert('Location Required', 'Please enable location services to find nearby hospitals.');
    }
  };

  const getLocationText = () => {
    if (!location) return 'Getting location...';
    return `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Emergency Support</Text>
            <Text style={styles.subtitle}>Get help when you need it most</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color="#4F46E5" />
            <Text style={styles.locationText}>{getLocationText()}</Text>
          </View>
        </View>

        {/* Emergency Actions */}
        <View style={styles.emergencySection}>
          <Text style={styles.sectionTitle}>🚨 Emergency Actions</Text>
          
          <TouchableOpacity 
            style={[styles.emergencyButton, styles.callButton]}
            onPress={handleEmergencyCall}
          >
            <Phone size={24} color="#FFFFFF" />
            <Text style={styles.emergencyButtonText}>Call 911</Text>
            <Text style={styles.emergencyButtonSubtext}>Life-threatening emergency</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.emergencyButton, styles.sosButton]}
            onPress={handleSOS}
          >
            <Shield size={24} color="#FFFFFF" />
            <Text style={styles.emergencyButtonText}>Send SOS Alert</Text>
            <Text style={styles.emergencyButtonSubtext}>Share location & medical info</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Access */}
        <View style={styles.quickAccessSection}>
          <Text style={styles.sectionTitle}>🏥 Quick Access</Text>
          
          <View style={styles.quickAccessGrid}>
            <TouchableOpacity style={styles.quickAccessButton} onPress={findNearbyHospital}>
              <MapPin size={24} color="#EF4444" />
              <Text style={styles.quickAccessText}>Find Hospital</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAccessButton} onPress={shareReport}>
              <FileText size={24} color="#4F46E5" />
              <Text style={styles.quickAccessText}>Medical Report</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.contactsSection}>
          <Text style={styles.sectionTitle}>📞 Emergency Contacts</Text>
          
          {emergencyContacts.map((contact, index) => (
            <TouchableOpacity
              key={index}
              style={styles.contactCard}
              onPress={() => callContact(contact.phone, contact.name)}
            >
              <View style={styles.contactInfo}>
                <User size={20} color="#4F46E5" />
                <View style={styles.contactDetails}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactRelationship}>{contact.relationship}</Text>
                </View>
              </View>
              
              <View style={styles.contactActions}>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
                <Phone size={16} color="#10B981" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Symptoms Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>📋 Recent Health Summary</Text>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Clock size={16} color="#6B7280" />
              <Text style={styles.summaryText}>
                {symptoms.length} symptoms logged in total
              </Text>
            </View>
            
            {symptoms.length > 0 && (
              <>
                <View style={styles.summaryRow}>
                  <AlertTriangle size={16} color="#F59E0B" />
                  <Text style={styles.summaryText}>
                    Last symptom: {symptoms[symptoms.length - 1]?.name} 
                    ({new Date(symptoms[symptoms.length - 1]?.timestamp).toLocaleDateString()})
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.generateReportButton}
                  onPress={shareReport}
                >
                  <FileText size={16} color="#4F46E5" />
                  <Text style={styles.generateReportText}>Generate Full Report</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Important Information */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>ℹ️ Important Information</Text>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>When to Call 911:</Text>
            <Text style={styles.infoText}>
              • Chest pain or difficulty breathing{'\n'}
              • Severe allergic reactions{'\n'}
              • Loss of consciousness{'\n'}
              • Severe bleeding or trauma{'\n'}
              • Signs of stroke (F.A.S.T.)
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Your Current Location:</Text>
            <Text style={styles.infoText}>
              {location ? 
                `Lat: ${location.coords.latitude.toFixed(6)}\nLng: ${location.coords.longitude.toFixed(6)}` :
                'Enable location services for emergency assistance'
              }
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
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#4F46E5',
    marginLeft: 4,
    fontFamily: 'monospace',
  },
  emergencySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  callButton: {
    backgroundColor: '#DC2626',
  },
  sosButton: {
    backgroundColor: '#F59E0B',
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
    marginRight: 16,
  },
  emergencyButtonSubtext: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.9,
    position: 'absolute',
    bottom: 6,
  },
  quickAccessSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAccessButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickAccessText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    textAlign: 'center',
  },
  contactsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactDetails: {
    marginLeft: 12,
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  contactRelationship: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactPhone: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: 'monospace',
  },
  summarySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
    flex: 1,
  },
  generateReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  generateReportText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
    marginLeft: 6,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
});