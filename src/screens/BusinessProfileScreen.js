import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { State, City } from 'country-state-city';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { colors, typography, spacing, radius } from '../theme';
import * as api from '../api';

const TABS = ['Basics', 'Business Info', 'GST Info', 'Communication'];

const CATEGORIES = [
  { id: 'Agriculture', name: 'Agriculture', icon: 'tractor', color: '#4CAF50' },
  { id: 'Construction', name: 'Construction', icon: 'wall', color: '#00BCD4' },
  { id: 'Education', name: 'Education', icon: 'book-open-variant', color: '#009688' },
  { id: 'Electronics', name: 'Electronics', icon: 'power-plug', color: '#2196F3' },
  { id: 'Financial Services', name: 'Financial Services', icon: 'currency-inr', color: '#4CAF50' },
  { id: 'Food/Restaurant', name: 'Food/Restaurant', icon: 'silverware-fork-knife', color: '#2196F3' },
  { id: 'Clothes/Fashion', name: 'Clothes/Fashion', icon: 'tshirt-crew', color: '#3F51B5' },
  { id: 'Hardware', name: 'Hardware', icon: 'format-paint', color: '#00BCD4' },
  { id: 'Jewellery', name: 'Jewellery', icon: 'diamond-stone', color: '#03A9F4' },
  { id: 'Healthcare & Fitness', name: 'Healthcare & Fitness', icon: 'pill', color: '#009688' },
  { id: 'Kirana/Grocery', name: 'Kirana/Grocery', icon: 'basket', color: '#3F51B5' },
  { id: 'Transport', name: 'Transport', icon: 'truck-fast', color: '#2196F3' },
  { id: 'Others', name: 'Others', icon: 'dots-grid', color: '#607D8B' },
];

const SUBCATEGORIES = {
  'Agriculture': [
    'Agri Solution', 'Agricultural Machinery (Rent)', 'Agro Products (Retailer)', 'Farmers', 'Fruits Mandi', 'Grains Mandi', 'Harvesters (Service)', 'Loading/Unloading services', 'Mill', 'Organic Farm', 'Poultry', 'Vegetables Mandi', 'Other'
  ],
  'Construction': [
    'Building Material', 'Contractor', 'Hardware Store', 'Interior Designer', 'Plumber/Electrician', 'Real Estate Agent', 'Timber/Plywood', 'Other'
  ],
  'Education': [
    'Coaching Center', 'College/University', 'School', 'Stationery Store', 'Tutor', 'Other'
  ],
  'Electronics': [
    'Mobile Shop', 'Computer Shop', 'Electronic Appliances', 'Repair/Service Center', 'Other'
  ],
  'Financial Services': [
    'Agent/Broker', 'CA/CS', 'Insurance', 'Money Transfer', 'Tax Consultant', 'Other'
  ],
  'Food/Restaurant': [
    'Bakery', 'Cafe', 'Catering', 'Dairy/Sweets', 'Restaurant/Hotel', 'Street Food/Snacks', 'Other'
  ],
  'Clothes/Fashion': [
    'Boutique', 'Garments Shop', 'Tailor', 'Textile', 'Wholesaler', 'Other'
  ],
  'Hardware': [
    'Hardware Store', 'Paints', 'Pipes & Fittings', 'Sanitaryware', 'Other'
  ],
  'Jewellery': [
    'Imitation Jewellery', 'Precious Jewellery', 'Wholesaler', 'Other'
  ],
  'Healthcare & Fitness': [
    'Clinic/Hospital', 'Gym/Fitness', 'Medical Store/Pharmacy', 'Pathology Lab', 'Other'
  ],
  'Kirana/Grocery': [
    'FMCG Distributor', 'General Store', 'Supermarket', 'Wholesale Grocery', 'Other'
  ],
  'Transport': [
    'Auto/Taxi', 'Courier/Logistics', 'Goods Transport', 'Travel Agency', 'Other'
  ],
  'Others': [
    'Other'
  ]
};

const BUSINESS_TYPES = [
  { id: 'Retailer', name: 'Retailer', icon: 'storefront', color: '#4CAF50' },
  { id: 'Distributor', name: 'Distributor', icon: 'truck-fast', color: '#2196F3' },
  { id: 'Manufacturer', name: 'Manufacturer', icon: 'factory', color: '#3F51B5' },
  { id: 'Service Provider', name: 'Service Provider', icon: 'account-wrench', color: '#00BCD4' },
  { id: 'Trader', name: 'Trader', icon: 'briefcase', color: '#4CAF50' },
  { id: 'Other', name: 'Other', icon: 'dots-grid', color: '#607D8B' },
];

const REGISTRATION_TYPES = [
  'Sole Proprietorship/Individual',
  'Partnership/LLP',
  'Public/Private Limited',
  'Trust/Foundation',
  'Association/Body of Individuals',
  'HUF',
  'Unregistered Business (Not a Business)'
];

const EMPLOYEE_SIZES = [
  '1-2',
  '3-5',
  '6-9',
  '10-19',
  '20+'
];

export default function BusinessProfileScreen() {
  const navigation = useNavigation();
  const { currentBusiness, loadBusinesses } = useApp();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('Basics');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const scrollRef = useRef(null);
  const tabScrollRef = useRef(null);
  const sectionOffsets = useRef({});
  const tabBarHeight = useRef(50);
  const isScrolling = useRef(false);
  const scrollTimeout = useRef(null);

  // Local state for editing fields
  const [editingField, setEditingField] = useState(null); // e.g. 'name', 'address'
  const [editValue, setEditValue] = useState('');
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [tempCategory, setTempCategory] = useState('');
  
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [tempType, setTempType] = useState('');

  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [tempSubcategory, setTempSubcategory] = useState('');

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressObj, setAddressObj] = useState({ building: '', area: '', pincode: '', state: '', city: '' });
  
  const [showStateModal, setShowStateModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  
  const indiaStates = State.getStatesOfCountry('IN');
  const selectedStateObj = indiaStates.find(s => s.name === addressObj.state);
  const availableCities = selectedStateObj ? City.getCitiesOfState('IN', selectedStateObj.isoCode) : [];
  
  const [showRegTypeModal, setShowRegTypeModal] = useState(false);
  const [tempRegType, setTempRegType] = useState('');
  
  const [showEmpSizeModal, setShowEmpSizeModal] = useState(false);
  const [tempEmpSize, setTempEmpSize] = useState('');
  
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempName, setTempName] = useState('');

  const [showGstModal, setShowGstModal] = useState(false);
  const [tempGst, setTempGst] = useState('');
  
  useEffect(() => {
    return () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);
  
  if (!currentBusiness) return null;

  const displayMobile = currentBusiness.mobile || user?.mobile || '';
  const displayEmail = currentBusiness.email || user?.email || '';

  const getDisplayAddress = () => {
    if (!currentBusiness.address) return '';
    try {
      const obj = JSON.parse(currentBusiness.address);
      if (typeof obj === 'object' && obj !== null) {
        return [obj.building, obj.area, obj.city, obj.state, obj.pincode].filter(Boolean).join(', ');
      }
    } catch {
      // ignore
    }
    return currentBusiness.address;
  };

  // Calculate profile strength
  const checkFields = [
    currentBusiness.logo,
    currentBusiness.name,
    currentBusiness.address,
    currentBusiness.staff_size,
    currentBusiness.category,
    currentBusiness.subcategory,
    currentBusiness.business_type,
    currentBusiness.registration_type,
    currentBusiness.gstin, // Using gstin presence to indicate GST info completion
    displayMobile,
    displayEmail
  ];
  
  const filledCount = checkFields.filter(f => !!f && f !== '🏢').length;
  const totalCount = checkFields.length;
  const strengthPct = Math.round((filledCount / totalCount) * 100);
  
  let strengthLevel = 'Low';
  let strengthColor = colors.red;
  if (strengthPct > 40 && strengthPct <= 80) { strengthLevel = 'Medium'; strengthColor = colors.orange; }
  else if (strengthPct > 80) { strengthLevel = 'High'; strengthColor = colors.green; }

  const handleSave = async (field, value) => {
    setLoading(true);
    try {
      await api.updateBusiness(currentBusiness.id, { [field]: value });
      await loadBusinesses(); // refresh context
      setEditingField(null);
    } catch (err) {
      alert(err.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setUploading(true);
      try {
        await api.uploadBusinessLogo(currentBusiness.id, result.assets[0]);
        await loadBusinesses();
      } catch (error) {
        alert(error.message || 'Failed to upload logo');
      } finally {
        setUploading(false);
      }
    }
  };

  const renderField = (label, value, fieldName, isUpload = false) => {
    const isEmpty = !value || value === '🏢';
    return (
      <View style={styles.fieldRow}>
        <View style={styles.fieldContent}>
          <Text style={styles.fieldLabel}>{label}</Text>
          {editingField === fieldName && fieldName !== 'category' ? (
            <TextInput
              style={styles.fieldInput}
              value={editValue}
              onChangeText={setEditValue}
              autoFocus
              onBlur={() => handleSave(fieldName, editValue)}
              onSubmitEditing={() => handleSave(fieldName, editValue)}
            />
          ) : (
            <Text style={value ? styles.fieldValue : styles.fieldPlaceholder}>
              {value || `Add ${label.toLowerCase()}`}
            </Text>
          )}
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.iconBtn}
            onPress={() => {
              if (fieldName === 'category') {
                setTempCategory(value || '');
                setShowCategoryModal(true);
              } else if (fieldName === 'subcategory') {
                if (!currentBusiness?.category) {
                  alert('Please select a Business Category first.');
                  return;
                }
                setTempSubcategory(value || '');
                setShowSubcategoryModal(true);
              } else if (fieldName === 'business_type') {
                setTempType(value || '');
                setShowTypeModal(true);
              } else if (fieldName === 'address') {
                try {
                  const parsed = JSON.parse(currentBusiness.address || '{}');
                  setAddressObj({
                    building: parsed.building || '',
                    area: parsed.area || '',
                    pincode: parsed.pincode || '',
                    state: parsed.state || '',
                    city: parsed.city || ''
                  });
                } catch {
                  setAddressObj({ building: currentBusiness.address || '', area: '', pincode: '', state: '', city: '' });
                }
                setShowAddressModal(true);
              } else if (fieldName === 'registration_type') {
                setTempRegType(value || '');
                setShowRegTypeModal(true);
              } else if (fieldName === 'staff_size') {
                setTempEmpSize(value || '');
                setShowEmpSizeModal(true);
              } else if (fieldName === 'name') {
                setTempName(value || '');
                setShowNameModal(true);
              } else if (fieldName === 'gstin') {
                setTempGst(value || '');
                setShowGstModal(true);
              } else {
                setEditValue(value || '');
                setEditingField(fieldName);
              }
            }}
          >
            <Ionicons name={isEmpty ? "add" : "pencil"} size={20} color={colors.blue} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleScroll = (event) => {
    if (isScrolling.current) return;
    
    const scrollY = event.nativeEvent.contentOffset.y;
    // Add tabBarHeight and a small buffer to determine which section is active
    const viewPortTop = scrollY + tabBarHeight.current + 20; 

    let currentTab = TABS[0];
    for (const tab of TABS) {
      if (sectionOffsets.current[tab] !== undefined && viewPortTop >= sectionOffsets.current[tab]) {
        currentTab = tab;
      }
    }
    
    if (currentTab !== activeTab) {
      setActiveTab(currentTab);
      scrollToTabBtn(currentTab);
    }
  };

  const handleTabPress = (tab) => {
    setActiveTab(tab);
    scrollToTabBtn(tab);
    isScrolling.current = true;
    
    const targetY = (sectionOffsets.current[tab] || 0) - tabBarHeight.current;
    scrollRef.current?.scrollTo({ y: Math.max(0, targetY), animated: true });
    
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      isScrolling.current = false;
    }, 600); // Wait for scroll animation to finish
  };

  const scrollToTabBtn = (tab) => {
    const idx = TABS.indexOf(tab);
    if (idx !== -1 && tabScrollRef.current) {
      tabScrollRef.current.scrollTo({ x: Math.max(0, idx * 100 - 100), animated: true });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        stickyHeaderIndices={[1]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Profile Strength */}
        <View style={styles.strengthCard}>
          <View style={styles.strengthBarBg}>
            <View style={[styles.strengthBarFill, { width: `${strengthPct}%`, backgroundColor: strengthColor }]} />
          </View>
          <View style={styles.strengthLabels}>
            <Text style={styles.strengthText}>Profile Strength: <Text style={{ color: strengthColor }}>{strengthLevel}</Text></Text>
            <Text style={styles.strengthPctText}>{strengthPct}%</Text>
          </View>
          
          {filledCount < totalCount && (
            <View style={styles.incompleteBox}>
              <Ionicons name="information-circle" size={20} color={colors.blue} />
              <Text style={styles.incompleteText}>
                {totalCount - filledCount} out of {totalCount} fields are incomplete. Fill these to complete your profile
              </Text>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View 
          style={[styles.tabsWrapper, { backgroundColor: '#fff' }]}
          onLayout={(e) => { tabBarHeight.current = e.nativeEvent.layout.height || 50; }}
        >
          <ScrollView 
            ref={tabScrollRef}
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.tabsContainer}
          >
            {TABS.map(tab => (
              <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => handleTabPress(tab)}>
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View onLayout={(e) => { sectionOffsets.current['Basics'] = e.nativeEvent.layout.y; }} style={styles.tabContent}>
          <Text style={styles.sectionTitle}>Basics</Text>
          
          <View style={styles.logoRow}>
            <TouchableOpacity style={styles.logoBox} onPress={pickImage} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator color={colors.blue} />
              ) : currentBusiness.logo && currentBusiness.logo.startsWith('/') ? (
                <Image source={{ uri: `http://localhost:3001${currentBusiness.logo}` }} style={styles.logoImage} />
              ) : (
                <Ionicons name="camera-outline" size={32} color={colors.gray400} />
              )}
            </TouchableOpacity>
            <View style={styles.logoTexts}>
              <Text style={styles.logoTitle}>Upload Business Logo</Text>
              <Text style={styles.logoSubtitle}>File Format: JPEG, PNG</Text>
            </View>
          </View>

          {renderField('Business Name', currentBusiness.name, 'name')}
          {renderField('Business Address', getDisplayAddress(), 'address')}
          {renderField('Employee Size', currentBusiness.staff_size, 'staff_size')}
        </View>

        <View onLayout={(e) => { sectionOffsets.current['Business Info'] = e.nativeEvent.layout.y; }} style={styles.tabContent}>
          <Text style={styles.sectionTitle}>Business Info</Text>
          {renderField('Business Category', currentBusiness.category, 'category')}
          {renderField('Business Subcategory', currentBusiness.subcategory, 'subcategory')}
          {renderField('Business Type', currentBusiness.business_type, 'business_type')}
          {renderField('Business Registration Type', currentBusiness.registration_type, 'registration_type')}
        </View>

        <View onLayout={(e) => { sectionOffsets.current['GST Info'] = e.nativeEvent.layout.y; }} style={styles.tabContent}>
          <Text style={styles.sectionTitle}>GST Info</Text>
          <TouchableOpacity 
            style={styles.checkboxRow} 
            onPress={() => {
              if (currentBusiness.gstin) {
                handleSave('gstin', '');
              } else {
                setTempGst('');
                setShowGstModal(true);
              }
            }}
          >
            <Ionicons name={currentBusiness.gstin ? 'checkbox' : 'square-outline'} size={24} color={currentBusiness.gstin ? colors.blue : colors.gray400} />
            <Text style={styles.checkboxText}>GST registered?</Text>
          </TouchableOpacity>
          {!!currentBusiness.gstin && renderField('GST Number', currentBusiness.gstin, 'gstin')}
        </View>

        <View onLayout={(e) => { sectionOffsets.current['Communication'] = e.nativeEvent.layout.y; }} style={styles.tabContent}>
          <Text style={styles.sectionTitle}>Communication</Text>
          {renderField('Business Mobile Number', displayMobile, 'mobile')}
          {renderField('Business Email', displayEmail, 'email')}
        </View>
      </ScrollView>

      <Modal visible={showCategoryModal} animationType="slide" onRequestClose={() => setShowCategoryModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.gray900} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Business Category</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.modalSubtitleContainer}>
            <Text style={styles.modalSubtitle}>This will help us personalise your app experience</Text>
          </View>
          
          <ScrollView contentContainerStyle={styles.gridContainer}>
            {CATEGORIES.map(cat => {
              const isSelected = tempCategory === cat.name;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.gridCard, isSelected && styles.gridCardSelected]}
                  onPress={() => setTempCategory(cat.name)}
                >
                  <View style={[styles.iconWrapper, { backgroundColor: isSelected ? cat.color + '20' : '#f5f5f5' }]}>
                    <MaterialCommunityIcons name={cat.icon} size={28} color={cat.color} />
                  </View>
                  <Text style={[styles.cardText, isSelected && styles.cardTextSelected]}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          
          <View style={styles.bottomBar}>
            <View style={styles.nextInfoRow}>
              <Text style={styles.nextText}>Next: <Text style={styles.nextCategoryText}>{tempCategory || 'Choose Category'}</Text></Text>
            </View>
            <TouchableOpacity 
              style={[styles.saveBtn, !tempCategory && styles.saveBtnDisabled]} 
              disabled={!tempCategory}
              onPress={() => {
                handleSave('category', tempCategory);
                setShowCategoryModal(false);
              }}
            >
              {!!tempCategory && <Ionicons name="checkmark" size={18} color="#fff" style={{ marginRight: 8 }} />}
              <Text style={[styles.saveBtnText, !tempCategory && styles.saveBtnTextDisabled]}>SAVE & NEXT</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={showTypeModal} animationType="slide" onRequestClose={() => setShowTypeModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTypeModal(false)} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.gray900} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Business Type</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.modalSubtitleContainer}>
            <Text style={styles.modalSubtitle}>This will help us personalise your app experience</Text>
          </View>
          
          <ScrollView contentContainerStyle={styles.listContainer}>
            {BUSINESS_TYPES.map(type => {
              const isSelected = tempType === type.name;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.listCard, isSelected && styles.gridCardSelected]}
                  onPress={() => setTempType(type.name)}
                >
                  <View style={[styles.iconWrapper, { backgroundColor: isSelected ? type.color + '20' : '#f5f5f5' }]}>
                    <MaterialCommunityIcons name={type.icon} size={28} color={type.color} />
                  </View>
                  <Text style={[styles.cardText, { fontSize: typography.base }, isSelected && styles.cardTextSelected]}>{type.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          
          <View style={styles.bottomBar}>
            <TouchableOpacity 
              style={[styles.saveBtn, !tempType && styles.saveBtnDisabled]} 
              disabled={!tempType}
              onPress={() => {
                handleSave('business_type', tempType);
                setShowTypeModal(false);
              }}
            >
              {!!tempType && <Ionicons name="checkmark" size={18} color="#fff" style={{ marginRight: 8 }} />}
              <Text style={[styles.saveBtnText, !tempType && styles.saveBtnTextDisabled]}>SAVE</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={showSubcategoryModal} animationType="slide" onRequestClose={() => setShowSubcategoryModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSubcategoryModal(false)} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.gray900} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Business Subcategory</Text>
            <TouchableOpacity style={styles.backBtn}>
              <Ionicons name="search" size={24} color={colors.blue} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.subCatCategoryRow}>
            <View>
              <Text style={styles.subCatCategoryLabel}>Category</Text>
              <Text style={styles.subCatCategoryValue}>{currentBusiness?.category || 'Not Selected'}</Text>
            </View>
            <TouchableOpacity onPress={() => { setShowSubcategoryModal(false); setShowCategoryModal(true); }}>
              <Text style={styles.subCatChangeText}>Change</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.subCatTitleContainer}>
            <Text style={styles.subCatTitle}>Subcategories of '{currentBusiness?.category || 'Category'}'</Text>
          </View>
          
          <ScrollView contentContainerStyle={styles.subCatListContainer}>
            {(SUBCATEGORIES[currentBusiness?.category] || SUBCATEGORIES['Others']).map(sub => {
              const isSelected = tempSubcategory === sub;
              return (
                <TouchableOpacity
                  key={sub}
                  style={[styles.radioCard, isSelected && styles.radioCardSelected]}
                  onPress={() => setTempSubcategory(sub)}
                >
                  <Ionicons 
                    name={isSelected ? "radio-button-on" : "radio-button-off"} 
                    size={24} 
                    color={isSelected ? colors.blue : colors.gray500} 
                    style={styles.radioIcon} 
                  />
                  <Text style={[styles.cardText, { fontSize: typography.base }]}>{sub}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          
          <View style={styles.bottomBar}>
            <TouchableOpacity 
              style={[styles.saveBtn, !tempSubcategory && styles.saveBtnDisabled]} 
              disabled={!tempSubcategory}
              onPress={() => {
                handleSave('subcategory', tempSubcategory);
                setShowSubcategoryModal(false);
              }}
            >
              {!!tempSubcategory && <Ionicons name="checkmark" size={18} color="#fff" style={{ marginRight: 8 }} />}
              <Text style={[styles.saveBtnText, !tempSubcategory && styles.saveBtnTextDisabled]}>SAVE</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={showAddressModal} animationType="slide" onRequestClose={() => setShowAddressModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddressModal(false)} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.gray900} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Business Address</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView contentContainerStyle={styles.formContainer}>
            <TextInput
              style={styles.formInput}
              placeholder="Building Name"
              placeholderTextColor={colors.gray400}
              value={addressObj.building}
              onChangeText={(t) => setAddressObj(p => ({ ...p, building: t }))}
            />
            <TextInput
              style={styles.formInput}
              placeholder="Area/Locality"
              placeholderTextColor={colors.gray400}
              value={addressObj.area}
              onChangeText={(t) => setAddressObj(p => ({ ...p, area: t }))}
            />
            <TextInput
              style={styles.formInput}
              placeholder="Pin Code"
              placeholderTextColor={colors.gray400}
              keyboardType="number-pad"
              value={addressObj.pincode}
              onChangeText={(t) => setAddressObj(p => ({ ...p, pincode: t }))}
            />
            
            <TouchableOpacity 
              style={styles.dropdownInput}
              onPress={() => setShowStateModal(true)}
            >
               <Text style={[styles.dropdownInputText, !addressObj.state && { color: colors.gray400 }]}>
                 {addressObj.state || "State"}
               </Text>
              <Ionicons name="caret-down" size={16} color={colors.gray500} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dropdownInput}
              onPress={() => {
                if (!addressObj.state) {
                  alert("Please select a State first.");
                  return;
                }
                setShowCityModal(true);
              }}
            >
               <Text style={[styles.dropdownInputText, !addressObj.city && { color: colors.gray400 }]}>
                 {addressObj.city || "City"}
               </Text>
              <Ionicons name="caret-down" size={16} color={colors.gray500} />
            </TouchableOpacity>
          </ScrollView>
          
          <View style={styles.bottomBar}>
            <TouchableOpacity 
              style={styles.saveBtn} 
              onPress={() => {
                const str = JSON.stringify(addressObj);
                handleSave('address', str);
                setShowAddressModal(false);
              }}
            >
              <Ionicons name="checkmark" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>SAVE</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={showStateModal} animationType="slide" onRequestClose={() => setShowStateModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowStateModal(false)} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.gray900} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select State</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView contentContainerStyle={styles.listContainer}>
            {indiaStates.map(state => (
              <TouchableOpacity
                key={state.isoCode}
                style={[styles.radioCard, addressObj.state === state.name && styles.radioCardSelected]}
                onPress={() => {
                  setAddressObj(prev => ({ ...prev, state: state.name, city: '' }));
                  setShowStateModal(false);
                }}
              >
                <Ionicons 
                  name={addressObj.state === state.name ? "radio-button-on" : "radio-button-off"} 
                  size={24} color={addressObj.state === state.name ? colors.blue : colors.gray500} style={styles.radioIcon} 
                />
                <Text style={styles.cardText}>{state.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={showCityModal} animationType="slide" onRequestClose={() => setShowCityModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCityModal(false)} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.gray900} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select City</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView contentContainerStyle={styles.listContainer}>
            {availableCities.map(city => (
              <TouchableOpacity
                key={city.name}
                style={[styles.radioCard, addressObj.city === city.name && styles.radioCardSelected]}
                onPress={() => {
                  setAddressObj(prev => ({ ...prev, city: city.name }));
                  setShowCityModal(false);
                }}
              >
                <Ionicons 
                  name={addressObj.city === city.name ? "radio-button-on" : "radio-button-off"} 
                  size={24} color={addressObj.city === city.name ? colors.blue : colors.gray500} style={styles.radioIcon} 
                />
                <Text style={styles.cardText}>{city.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={showRegTypeModal} animationType="slide" onRequestClose={() => setShowRegTypeModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowRegTypeModal(false)} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.gray900} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Business Registration Type</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.modalSubtitleContainer}>
            <Text style={styles.modalSubtitle}>This will help us personalise your app experience</Text>
          </View>
          
          <ScrollView contentContainerStyle={styles.listContainer}>
            {REGISTRATION_TYPES.map(type => {
              const isSelected = tempRegType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.radioCard, isSelected && styles.radioCardSelected]}
                  onPress={() => setTempRegType(type)}
                >
                  <Ionicons 
                    name={isSelected ? "radio-button-on" : "radio-button-off"} 
                    size={24} 
                    color={isSelected ? colors.blue : colors.gray500} 
                    style={styles.radioIcon} 
                  />
                  <Text style={[styles.cardText, { fontSize: typography.base }]}>{type}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          
          <View style={styles.bottomBar}>
            <TouchableOpacity 
              style={[styles.saveBtn, !tempRegType && styles.saveBtnDisabled]} 
              disabled={!tempRegType}
              onPress={() => {
                handleSave('registration_type', tempRegType);
                setShowRegTypeModal(false);
              }}
            >
              {!!tempRegType && <Ionicons name="checkmark" size={18} color="#fff" style={{ marginRight: 8 }} />}
              <Text style={[styles.saveBtnText, !tempRegType && styles.saveBtnTextDisabled]}>SAVE</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={showEmpSizeModal} animationType="slide" transparent={true} onRequestClose={() => setShowEmpSizeModal(false)}>
        <View style={styles.bottomSheetOverlay}>
          <View style={styles.bottomSheetContainer}>
            <View style={styles.bottomSheetHeader}>
              <TouchableOpacity onPress={() => setShowEmpSizeModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={colors.gray900} />
              </TouchableOpacity>
              <Text style={styles.bottomSheetTitle}>Select Employee Size</Text>
              <View style={{ width: 24 }} />
            </View>
            <View style={styles.modalSubtitleContainer}>
              <Text style={styles.modalSubtitle}>How many people work in your business?</Text>
            </View>
            
            <ScrollView contentContainerStyle={styles.bottomSheetList}>
              {EMPLOYEE_SIZES.map(size => {
                const isSelected = tempEmpSize === size;
                return (
                  <TouchableOpacity
                    key={size}
                    style={[styles.radioCard, isSelected && styles.radioCardSelected]}
                    onPress={() => setTempEmpSize(size)}
                  >
                    <Ionicons 
                      name={isSelected ? "radio-button-on" : "radio-button-off"} 
                      size={24} 
                      color={isSelected ? colors.blue : colors.gray500} 
                      style={styles.radioIcon} 
                    />
                    <Text style={[styles.cardText, { fontSize: typography.base }]}>{size}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            <View style={styles.bottomSheetFooter}>
              <TouchableOpacity 
                style={[styles.saveBtn, !tempEmpSize && styles.saveBtnDisabled]} 
                disabled={!tempEmpSize}
                onPress={() => {
                  handleSave('staff_size', tempEmpSize);
                  setShowEmpSizeModal(false);
                }}
              >
                <Text style={[styles.saveBtnText, !tempEmpSize && styles.saveBtnTextDisabled]}>APPLY</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showNameModal} animationType="slide" transparent={true} onRequestClose={() => setShowNameModal(false)}>
        <View style={styles.bottomSheetOverlay}>
          <View style={styles.bottomSheetContainer}>
            <View style={styles.bottomSheetHeader}>
              <TouchableOpacity onPress={() => setShowNameModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={colors.gray900} />
              </TouchableOpacity>
              <Text style={styles.bottomSheetTitle}>Business Name</Text>
              <View style={{ width: 24 }} />
            </View>
            
            <View style={styles.bottomSheetContent}>
              <View style={styles.floatingInputContainer}>
                <Text style={styles.floatingLabel}>Business Name</Text>
                <TextInput 
                  style={styles.floatingInput}
                  value={tempName}
                  onChangeText={setTempName}
                  autoFocus
                />
              </View>
            </View>
            
            <View style={styles.bottomSheetFooter}>
              <TouchableOpacity 
                style={[styles.saveBtn, !tempName && styles.saveBtnDisabled]} 
                disabled={!tempName}
                onPress={() => {
                  handleSave('name', tempName);
                  setShowNameModal(false);
                }}
              >
                {!!tempName && <Ionicons name="checkmark" size={18} color={colors.gray400} style={{ marginRight: 8 }} />}
                <Text style={[styles.saveBtnText, !tempName && styles.saveBtnTextDisabled]}>SAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showGstModal} animationType="slide" transparent={true} onRequestClose={() => setShowGstModal(false)}>
        <View style={styles.bottomSheetOverlay}>
          <View style={styles.bottomSheetContainer}>
            <View style={styles.bottomSheetHeader}>
              <TouchableOpacity onPress={() => setShowGstModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={colors.gray900} />
              </TouchableOpacity>
              <Text style={styles.bottomSheetTitle}>Enter GST Number</Text>
              <View style={{ width: 24 }} />
            </View>
            
            <View style={styles.bottomSheetContent}>
              <View style={styles.floatingInputContainer}>
                <Text style={styles.floatingLabel}>GST Number</Text>
                <TextInput 
                  style={styles.floatingInput}
                  value={tempGst}
                  onChangeText={setTempGst}
                  autoCapitalize="characters"
                  autoFocus
                />
              </View>
              <Text style={styles.inputHint}>Should be 15 digit. Example - 22AAAAA0000A1Z5</Text>
            </View>
            
            <View style={styles.bottomSheetFooter}>
              <TouchableOpacity 
                style={[styles.saveBtn, (!tempGst || tempGst.length !== 15) && styles.saveBtnDisabled]} 
                disabled={!tempGst || tempGst.length !== 15}
                onPress={() => {
                  handleSave('gstin', tempGst);
                  setShowGstModal(false);
                }}
              >
                {!!tempGst && tempGst.length === 15 && <Ionicons name="checkmark" size={18} color={colors.gray400} style={{ marginRight: 8 }} />}
                <Text style={[styles.saveBtnText, (!tempGst || tempGst.length !== 15) && styles.saveBtnTextDisabled]}>SAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: typography.lg, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  scrollContent: { paddingBottom: 40 },
  
  // Strength Card
  strengthCard: { padding: spacing[4] },
  strengthBarBg: { height: 8, backgroundColor: '#ffe6e6', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  strengthBarFill: { height: '100%', borderRadius: 4 },
  strengthLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  strengthText: { fontSize: typography.sm, color: colors.gray700, fontFamily: 'Poppins-Regular' },
  strengthPctText: { fontSize: typography.sm, color: colors.gray900, fontFamily: 'Poppins-Medium' },
  incompleteBox: { flexDirection: 'row', backgroundColor: colors.blue + '10', padding: 12, borderRadius: radius.md, alignItems: 'center', gap: 10 },
  incompleteText: { flex: 1, fontSize: typography.sm, color: colors.gray800, fontFamily: 'Poppins-Regular', lineHeight: 20 },

  // Tabs
  tabsWrapper: { borderBottomWidth: 1, borderBottomColor: colors.gray200 },
  tabsContainer: { paddingHorizontal: spacing[4], gap: 24 },
  tab: { paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.blue },
  tabText: { fontSize: typography.base, color: colors.gray500, fontFamily: 'Poppins-Medium' },
  tabTextActive: { color: colors.blue },

  tabContent: { paddingTop: 16 },
  sectionTitle: { fontSize: typography.sm, color: colors.gray500, fontFamily: 'Poppins-Medium', paddingHorizontal: spacing[4], paddingBottom: 8, backgroundColor: colors.gray50, paddingVertical: 8 },

  // Logo
  logoRow: { flexDirection: 'row', alignItems: 'center', padding: spacing[4], gap: 16, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  logoBox: { width: 70, height: 70, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.gray300, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoImage: { width: '100%', height: '100%' },
  logoTitle: { fontSize: typography.base, color: colors.blue, fontFamily: 'Poppins-Medium' },
  logoSubtitle: { fontSize: typography.xs, color: colors.gray400, fontFamily: 'Poppins-Regular', marginTop: 2 },

  // Fields
  fieldRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: spacing[4], borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  fieldContent: { flex: 1 },
  fieldLabel: { fontSize: typography.xs, color: colors.gray500, fontFamily: 'Poppins-Medium', marginBottom: 4 },
  fieldValue: { fontSize: typography.base, color: colors.gray900, fontFamily: 'Poppins-Medium' },
  fieldPlaceholder: { color: colors.gray400, fontFamily: 'Poppins-Regular' },
  fieldInput: { fontSize: typography.base, color: colors.gray900, fontFamily: 'Poppins-Medium', padding: 0, margin: 0, borderBottomWidth: 1, borderBottomColor: colors.blue },
  iconBtn: { padding: 8 },

  // Checkbox
  checkboxRow: { flexDirection: 'row', alignItems: 'center', padding: spacing[4], gap: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: colors.gray300, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.blue, borderColor: colors.blue },
  checkboxText: { fontSize: typography.base, color: colors.gray800, fontFamily: 'Poppins-Medium' },

  // Modal
  modalContainer: { flex: 1, backgroundColor: '#f9f9f9' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: 12, backgroundColor: '#fff' },
  modalTitle: { fontSize: typography.lg, fontFamily: 'Poppins-SemiBold', color: colors.gray900 },
  modalSubtitleContainer: { paddingHorizontal: spacing[4], paddingVertical: 16, backgroundColor: '#fff' },
  modalSubtitle: { fontSize: typography.sm, color: colors.gray600, fontFamily: 'Poppins-Medium' },
  
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing[2], paddingBottom: 120, backgroundColor: '#f9f9f9', justifyContent: 'space-between' },
  gridCard: { width: '48%', backgroundColor: '#fff', borderRadius: radius.md, padding: 16, marginBottom: spacing[3], alignItems: 'center', flexDirection: 'row', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, borderWidth: 1, borderColor: '#eee' },
  gridCardSelected: { borderColor: colors.blue, backgroundColor: colors.blue + '05' },
  
  listContainer: { padding: spacing[4], paddingBottom: 100, backgroundColor: '#f9f9f9' },
  listCard: { backgroundColor: '#fff', borderRadius: radius.md, padding: 16, marginBottom: spacing[3], alignItems: 'center', flexDirection: 'row', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, borderWidth: 1, borderColor: '#eee' },

  radioCard: { backgroundColor: '#fff', borderRadius: radius.md, padding: 16, marginBottom: spacing[3], alignItems: 'center', flexDirection: 'row', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, borderWidth: 1, borderColor: '#eee' },
  radioCardSelected: { backgroundColor: '#eef2fa', borderColor: '#d3e0f5' },
  radioIcon: { marginRight: 12 },

  iconWrapper: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardText: { flex: 1, fontSize: typography.xs, color: colors.gray800, fontFamily: 'Poppins-SemiBold' },
  cardTextSelected: { color: colors.blue },
  
  subCatCategoryRow: { backgroundColor: '#f5f5f5', paddingHorizontal: spacing[4], paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  subCatCategoryLabel: { fontSize: typography.xs, color: colors.gray600, fontFamily: 'Poppins-Regular' },
  subCatCategoryValue: { fontSize: typography.base, color: colors.gray900, fontFamily: 'Poppins-SemiBold' },
  subCatChangeText: { color: colors.blue, fontFamily: 'Poppins-Medium', fontSize: typography.sm },
  subCatTitleContainer: { paddingHorizontal: spacing[4], paddingTop: 16, paddingBottom: 8, backgroundColor: '#fff' },
  subCatTitle: { fontSize: typography.sm, color: colors.gray600, fontFamily: 'Poppins-Medium' },
  subCatListContainer: { padding: spacing[4], paddingBottom: 100, backgroundColor: '#fff' },

  formContainer: { padding: spacing[4], gap: 16, paddingBottom: 100 },
  formInput: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: radius.sm, paddingHorizontal: 16, paddingVertical: 14, fontSize: typography.base, fontFamily: 'Poppins-Regular', color: colors.gray900, backgroundColor: '#fff' },
  dropdownInput: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: radius.sm, paddingHorizontal: 16, backgroundColor: '#fff' },
  dropdownInputText: { flex: 1, paddingVertical: 14, fontSize: typography.base, fontFamily: 'Poppins-Regular', color: colors.gray900, outlineStyle: 'none' },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#f0f0f0', borderTopWidth: 1, borderTopColor: '#e0e0e0', paddingBottom: spacing[4] },
  nextInfoRow: { paddingHorizontal: spacing[4], paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' },
  nextText: { fontSize: typography.xs, color: colors.gray600, fontFamily: 'Poppins-Medium' },
  nextCategoryText: { color: colors.gray900, fontFamily: 'Poppins-SemiBold' },
  saveBtn: { backgroundColor: colors.blue, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, marginHorizontal: spacing[4], marginTop: 12, borderRadius: radius.sm },
  saveBtnDisabled: { backgroundColor: '#d5d5d5' },
  saveBtnText: { color: '#fff', fontSize: typography.sm, fontFamily: 'Poppins-SemiBold', letterSpacing: 0.5 },
  saveBtnTextDisabled: { color: '#999' },

  // Bottom Sheet
  bottomSheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheetContainer: { backgroundColor: '#fff', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '80%' },
  bottomSheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  closeBtn: { padding: 4 },
  bottomSheetTitle: { fontSize: typography.base, fontFamily: 'Poppins-SemiBold', color: colors.gray900 },
  bottomSheetList: { padding: spacing[4], paddingBottom: spacing[4] },
  bottomSheetContent: { padding: spacing[4], paddingBottom: spacing[6] },
  bottomSheetFooter: { padding: spacing[4], borderTopWidth: 1, borderTopColor: '#f0f0f0', backgroundColor: '#fff', paddingBottom: 24 },
  
  floatingInputContainer: { borderWidth: 1, borderColor: colors.blue, borderRadius: radius.sm, paddingHorizontal: 16, paddingVertical: 14, marginTop: 16, marginBottom: 8, position: 'relative' },
  floatingLabel: { position: 'absolute', top: -10, left: 12, backgroundColor: '#fff', paddingHorizontal: 4, fontSize: typography.xs, color: colors.blue, fontFamily: 'Poppins-Regular' },
  floatingInput: { fontSize: typography.base, fontFamily: 'Poppins-Regular', color: colors.gray900, padding: 0 },
  inputHint: { fontSize: typography.xs, color: colors.gray500, fontFamily: 'Poppins-Regular', marginTop: 4, marginLeft: 4 }
});
