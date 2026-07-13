// Single source of truth for business category / type / registration options.
// Shared by BusinessProfileScreen (edit existing business) and
// AddBusinessScreen (create new business) so both stay in sync.

export const CATEGORIES = [
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

export const SUBCATEGORIES = {
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

export const BUSINESS_TYPES = [
  { id: 'Retailer', name: 'Retailer', icon: 'storefront', color: '#4CAF50' },
  { id: 'Distributor', name: 'Distributor', icon: 'truck-fast', color: '#2196F3' },
  { id: 'Manufacturer', name: 'Manufacturer', icon: 'factory', color: '#3F51B5' },
  { id: 'Service Provider', name: 'Service Provider', icon: 'account-wrench', color: '#00BCD4' },
  { id: 'Trader', name: 'Trader', icon: 'briefcase', color: '#4CAF50' },
  { id: 'Other', name: 'Other', icon: 'dots-grid', color: '#607D8B' },
];

export const REGISTRATION_TYPES = [
  'Sole Proprietorship/Individual',
  'Partnership/LLP',
  'Public/Private Limited',
  'Trust/Foundation',
  'Association/Body of Individuals',
  'HUF',
  'Unregistered Business (Not a Business)'
];

export const EMPLOYEE_SIZES = [
  '1-2',
  '3-5',
  '6-9',
  '10-19',
  '20+'
];
