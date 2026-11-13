import React, { createContext, useContext, useState, useEffect } from 'react';

const TRANSLATIONS = {
  en: {
    appName: 'MySawari',
    tagline: 'Belagavi’s First 3D Ride Platform',
    liveEta: 'LIVE ETA',
    min: 'MIN',
    bookNow: 'Book Now',
    whereTo: 'Where to?',
    pickup: 'Pickup Location',
    pickupPlaceholder: 'Enter pickup point in Belagavi...',
    destination: 'Destination',
    dropPlaceholder: 'Where are you going in Belagavi?',
    swap: 'Swap locations',
    selectVehicle: 'Select Your Ride',
    viewFares: 'Compare Fares',
    proceedBooking: 'Book Selected Ride',
    autoActiveBanner: '🛺 Auto Rickshaw Selected · Enter Pickup & Destination',
    autoTagline: 'Metered & fair rates · Direct Belagavi pickup',
    cabSedan: 'Cab Sedan',
    suvXl: 'SUV / XL',
    autoRickshaw: 'Auto Rickshaw',
    bikeTaxi: 'Bike Taxi',
    menu: 'Menu',
    profile: 'Profile',
    coins: 'Coins',
    emergencySos: 'Emergency SOS',
    rideBuddy: 'Ride Buddy',
    rideBuddyDesc: 'Share route & split fare with customer permission',
    routeAssist: 'Route Assist',
    routeAssistDesc: 'Report & avoid road closures or obstacles with photos',
    ridePass: 'Ride Pass',
    ridePassDesc: 'Daily, monthly, or yearly commuter subscriptions',
    language: 'Language',
    languageDesc: 'English, Kannada (ಕನ್ನಡ) & Hindi (हिंदी)',
    sosSetup: 'SOS Setup',
    sosSetupDesc: 'Add emergency contacts & auto live location tracking',
    aboutMySawari: 'About MySawari',
    aboutDesc: 'Belagavi’s smart mobility & dispatch network',
    close: 'Close',
    save: 'Save',
    active: 'Active',
    select: 'Select'
  },
  kn: {
    appName: 'ಮೈಸವಾರಿ',
    tagline: 'ಬೆಳಗಾವಿಯ ಪ್ರಥಮ 3D ರೈಡ್ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್',
    liveEta: 'ಲೈವ್ ಸಮಯ',
    min: 'ನಿಮಿಷ',
    bookNow: 'ಈಗಲೇ ಬುಕ್ ಮಾಡಿ',
    whereTo: 'ಎಲ್ಲಿಗೆ ಹೋಗಬೇಕು?',
    pickup: 'ಪಿಕ್-ಅಪ್ ಸ್ಥಳ',
    pickupPlaceholder: 'ಬೆಳಗಾವಿಯ ಪಿಕ್-ಅಪ್ ಸ್ಥಳ ನಮೂದಿಸಿ...',
    destination: 'ಗಮ್ಯಸ್ಥಾನ',
    dropPlaceholder: 'ಬೆಳಗಾವಿಯಲ್ಲಿ ಎಲ್ಲಿಗೆ ಹೋಗಬೇಕು?',
    swap: 'ಸ್ಥಳ ಬದಲಾಯಿಸಿ',
    selectVehicle: 'ನಿಮ್ಮ ವಾಹನ ಆಯ್ಕೆಮಾಡಿ',
    viewFares: 'ದರ ಹೋಲಿಕೆ ಮಾಡಿ',
    proceedBooking: 'ಆಯ್ಕೆಮಾಡಿದ ರೈಡ್ ಬುಕ್ ಮಾಡಿ',
    autoActiveBanner: '🛺 ಆಟೋ ರಿಕ್ಷಾ ಆಯ್ಕೆಯಾಗಿದೆ · ಪಿಕ್-ಅಪ್ ಮತ್ತು ಗಮ್ಯಸ್ಥಾನ ನಮೂದಿಸಿ',
    autoTagline: 'ಮೀಟರ್ ಆಧಾರಿತ ನ್ಯಾಯಯುತ ದರಗಳು · ನೇರ ಬೆಳಗಾವಿ ಪಿಕ್-ಅಪ್',
    cabSedan: 'ಕ್ಯಾಬ್ ಸೆಡಾನ್',
    suvXl: 'ಎಸ್‌ಯುವಿ / ಎಕ್ಸ್‌ಎಲ್',
    autoRickshaw: 'ಆಟೋ ರಿಕ್ಷಾ',
    bikeTaxi: 'ಬೈಕ್ ಟ್ಯಾಕ್ಸಿ',
    menu: 'ಮೆನು',
    profile: 'ಪ್ರೊಫೈಲ್',
    coins: 'ಕಾಯಿನ್‌ಗಳು',
    emergencySos: 'ತುರ್ತು SOS',
    rideBuddy: 'ರೈಡ್ ಬಡ್ಡಿ',
    rideBuddyDesc: 'ಗ್ರಾಹಕರ ಅನುಮತಿಯೊಂದಿಗೆ ರೈಡ್ ಹಂಚಿಕೊಳ್ಳಿ ಮತ್ತು ದರ ವಿಭಜಿಸಿ',
    routeAssist: 'ರೂಟ್ ಅಸಿಸ್ಟ್',
    routeAssistDesc: 'ರಸ್ತೆ ಬಂದ್ ಮತ್ತು ಸಮಸ್ಯೆಗಳ ಫೋಟೋ ಹಾಕಿ ಬೇರೆ ಮಾರ್ಗ ಬಳಸಿ',
    ridePass: 'ರೈಡ್ ಪಾಸ್',
    ridePassDesc: 'ದೈನಂದಿನ, ಮಾಸಿಕ ಅಥವಾ ವಾರ್ಷಿಕ ಪಾಸ್ ಚಂದಾದಾರಿಕೆ',
    language: 'ಭಾಷೆ',
    languageDesc: 'ಇಂಗ್ಲಿಷ್, ಕನ್ನಡ ಮತ್ತು ಹಿಂದಿ',
    sosSetup: 'SOS ಸೆಟಪ್',
    sosSetupDesc: 'ತುರ್ತು ಸಂಪರ್ಕಗಳು ಮತ್ತು ಸ್ವಯಂಚಾಲಿತ ಲೈವ್ ಲೊಕೇಶನ್ ಕಳುಹಿಸುವಿಕೆ',
    aboutMySawari: 'ಮೈಸವಾರಿ ಬಗ್ಗೆ',
    aboutDesc: 'ಬೆಳಗಾವಿಯ ಸ್ಮಾರ್ಟ್ ಮೊಬಿಲಿಟಿ ನೆಟ್‌ವರ್ಕ್',
    close: 'ಮುಚ್ಚಿ',
    save: 'ಉಳಿಸಿ',
    active: 'ಸಕ್ರಿಯ',
    select: 'ಆಯ್ಕೆಮಾಡಿ'
  },
  hi: {
    appName: 'मायसवारी',
    tagline: 'बेलगावी का पहला 3D राइड प्लेटफॉर्म',
    liveEta: 'लाइव समय',
    min: 'मिनट',
    bookNow: 'अभी बुक करें',
    whereTo: 'कहाँ जाना है?',
    pickup: 'पिकअप स्थान',
    pickupPlaceholder: 'बेलगावी में पिकअप स्थान दर्ज करें...',
    destination: 'गंतव्य',
    dropPlaceholder: 'बेलगावी में कहाँ जाना चाहते हैं?',
    swap: 'स्थान बदलें',
    selectVehicle: 'अपनी सवारी चुनें',
    viewFares: 'किराया तुलना करें',
    proceedBooking: 'सवारी बुक करें',
    autoActiveBanner: '🛺 ऑटो रिक्शा चयनित · पिकअप और गंतव्य दर्ज करें',
    autoTagline: 'मीटर आधारित उचित दरें · डायरेक्ट पिकअप',
    cabSedan: 'कैब सेडान',
    suvXl: 'एसयूवी / एक्सएल',
    autoRickshaw: 'ऑटो रिक्शा',
    bikeTaxi: 'बाइक टैक्सी',
    menu: 'मेनू',
    profile: 'प्रोफ़ाइल',
    coins: 'सिक्के',
    emergencySos: 'आपातकालीन SOS',
    rideBuddy: 'राइड बडी',
    rideBuddyDesc: 'ग्राहक की अनुमति से सवारी साझा करें और किराया बांटें',
    routeAssist: 'रूट असिस्ट',
    routeAssistDesc: 'सड़क बंद होने की फोटो अपलोड करें और सुरक्षित रास्ता चुनें',
    ridePass: 'राइड पास',
    ridePassDesc: 'दैनिक, मासिक या वार्षिक कम्यूटर पास सब्सक्रिप्शन',
    language: 'भाषा',
    languageDesc: 'अंग्रेजी, कन्नड़ (ಕನ್ನಡ) और हिंदी (हिंदी)',
    sosSetup: 'SOS सेटअप',
    sosSetupDesc: 'आपातकालीन संपर्क और स्वचालित लाइव लोकेशन शेयरिंग',
    aboutMySawari: 'मायसवारी के बारे में',
    aboutDesc: 'बेलगावी का स्मार्ट मोबिलिटी और राइड डिस्पैच नेटवर्क',
    close: 'बंद करें',
    save: 'सहेजें',
    active: 'सक्रिय',
    select: 'चुनें'
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('mysawari_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('mysawari_lang', lang);
  }, [lang]);

  const t = (key) => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, availableLanguages: ['en', 'kn', 'hi'] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
