
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved as Language) || 'fr';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string) => {
    const keys = key.split('.');
    let current: any = translations[language];
    for (const k of keys) {
      if (current[k] === undefined) {
        console.warn(`Translation key not found: ${key} for language: ${language}`);
        return key;
      }
      current = current[k];
    }
    return current;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const translations: Record<Language, any> = {
  en: {
    common: {
      dashboard: 'Dashboard',
      products: 'Products',
      categories: 'Categories',
      clients: 'Clients',
      suppliers: 'Suppliers',
      client: 'Client',
      supplier: 'Supplier',
      invoices: 'Invoices',
      medicalOfficer: 'Medical Officer',
      search: 'Search',
      clear: 'Clear',
      actions: 'Actions',
      add: 'Add',
      save: 'Save',
      update: 'Update',
      delete: 'Delete',
      cancel: 'Cancel',
      dismiss: 'Dismiss',
      back: 'Back',
      print: 'Print',
      loading: 'Loading...',
      type: 'Type',
      status: 'Status',
      date: 'Date',
      total: 'Total',
      paid: 'Paid',
      pending: 'Pending',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      address: 'Address',
      category: 'Category',
      price: 'Price',
      cost: 'Cost',
      stock: 'Stock',
      minStock: 'Min Stock',
      sku: 'SKU',
      expiryDate: 'Expiry Date',
      quantity: 'Quantity',
      subtotal: 'Subtotal',
      initializingPersistence: 'Initializing Persistence...',
      confirmDelete: 'Confirm Deletion',
      confirmDeleteMsg: 'Are you sure you want to delete this item? This action cannot be undone.',
      confirm: 'Confirm',
      currency: 'DA',
      ref: 'REF:'
    },
    nav: {
      overview: 'Overview',
      inventory: 'Inventory',
      relations: 'Relations',
      finance: 'Finance',
      cash: 'Cash Desk',
      newSale: 'New Practice Sale',
      endSession: 'End Session'
    },
    dashboard: {
      overview: 'Practice Overview',
      subtitle: 'Clinical supply levels and operational metrics.',
      revenue: 'Procedure Revenue',
      profit: 'Est. Clinical Profit',
      safetyAlerts: 'Safety Alerts',
      quickActions: 'Quick Actions',
      newSale: 'New Sale',
      newPurchase: 'New Purchase',
      clinicalAlerts: 'Clinical Alerts',
      expiringSoon: 'Expiring soon',
      ofLines: 'of {total} lines',
      financialPerformance: 'Financial Performance (DA)',
      supplyDistribution: 'Supply Distribution'
    },
    products: {
      title: 'Dental Supplies',
      subtitle: 'Track clinical materials across {count} items.',
      registerNew: 'Register New Supply',
      searchPlaceholder: 'Search by name or SKU...',
      allCategories: 'All Categories',
      stockStatus: 'Stock Status',
      inStock: 'In Stock',
      lowStock: 'Low Stock',
      outOfStock: 'Out of Stock',
      productInfo: 'Product Info',
      classification: 'Classification',
      financials: 'Financials (DA)',
      safetyExpiry: 'Safety / Expiry',
      registerTitle: 'Register Dental Supply',
      updateTitle: 'Update Dental Supply',
      clinicalName: 'Clinical Product Name',
      skuId: 'SKU / Barcode ID',
      expirySafety: 'Expiry Date (Safety)',
      retailPrice: 'Retail Price (DA)',
      purchaseCost: 'Purchase Cost (DA)',
      openingStock: 'Opening Stock',
      minAlert: 'Min Alert Level',
      commitChanges: 'Commit Changes',
      completeRegistration: 'Complete Registration',
      stockLevel: 'Stock Level',
      noMatch: 'No supplies match your search.',
      requestingCamera: 'Requesting Camera...',
      accessRestricted: 'Access Restricted',
      tryAgain: 'Try Again',
      insecureContext: 'Insecure Context',
      scanNotice: 'Please check browser permissions. Note: Mobile camera scanning requires a **secure connection (HTTPS)** or localhost access.'
    },
    categories: {
      title: 'Supply Categories',
      subtitle: 'Organize your clinical inventory into manageable groups.',
      addCategory: 'Add Category',
      newCategory: 'New Category',
      editCategory: 'Edit Category',
      categoryId: 'Classification ID',
      noCategories: 'No categories defined yet. Add your first one to organize stock.',
      deleteMessage: 'Are you sure you want to delete this category? This action cannot be undone and may affect associated products.'
    },
    entities: {
      clients: {
        title: 'Client Directory',
        subtitle: 'Managing {count} active client accounts.'
      },
      suppliers: {
        title: 'Supplier Directory',
        subtitle: 'Managing {count} active supplier accounts.'
      },
      new: 'New {type}',
      store: 'Store {type}',
      displayName: 'Display Name',
      primaryPhone: 'Primary Phone',
      physicalAddress: 'Physical Address',
      outstandingBalance: 'Outstanding Balance',
      accountStatus: 'Account Status',
      fullySettled: 'Fully Settled'
    },
    invoices: {
      title: 'Ledger & Invoices',
      subtitle: 'Transaction history for your practice (Amounts in DA).',
      buyStock: 'Buy Stock',
      sellItems: 'Sell Items',
      advancedFilters: 'Advanced Filters',
      searchLedger: 'Search Ledger',
      dateRange: 'Date Range',
      to: 'to',
      classification: 'Classification',
      allTypes: 'All Types',
      practiceSales: 'Practice Sales',
      supplyOrders: 'Supply Orders',
      billingEntity: 'Billing Entity',
      allEntities: 'All Entities',
      reference: 'Invoice Reference',
      balance: 'Balance (DA)',
      view: 'View',
      noResults: 'No transactions found matching your selection.',
      noResultsDetailed: 'No results match your clinical filters.',
      clearFilters: 'Clear Filters',
      proforma: 'Proforma Invoice',
      purchaseOrder: 'Purchase Order',
      finalInvoice: 'Tax Invoice'
    },
    invoiceCreator: {
      system: 'Invoice System',
      postSale: 'Post Sale',
      postOrder: 'Post Order',
      billingEntity: 'Billing Entity',
      chooseEntity: 'Choose {type}...',
      finalTotal: 'Final Total (DA)',
      productItem: 'Product / Item',
      lineTotal: 'Line Total',
      manualEntry: 'Manual Entry',
      scanBarcode: 'Scan Barcode',
      verifyNotice: 'Verify stock levels before posting. This action updates permanent inventory records and cannot be undone via this dashboard.',
      netPayable: 'Net Payable',
      amountPaid: 'Amount Paid Today (DA)',
      remainingDebt: 'Remaining Debt',
      cameraAccessFailed: 'Could not access camera. Please check permissions.',
      scannedProductNotFound: 'Product with SKU "{sku}" not found in inventory.',
      addProduct: 'Select Product...',
      quantity: 'Quantity',
      unitPrice: 'Price (DA)',
      subtotal: 'Subtotal'
    },
    invoiceDetail: {
      notFound: 'Invoice not found',
      returnLedger: 'Return to Ledger',
      printInvoice: 'Print Invoice',
      medicalSupplySolutions: 'Medical Supply Solutions',
      billTo: 'Bill To',
      totalPayable: 'Total Payable',
      balanceDue: 'Balance Due',
      recordPayment: 'Record Payment',
      settleBalance: 'Settle Balance',
      postPayment: 'Post Payment',
      authorizedSignature: 'Authorized Signature',
      termsAndConditions: 'Terms & Conditions',
      term1: '1. Please quote invoice number for all payment references.',
      term2: '2. Payment is due within 30 days unless otherwise agreed.',
      term3: '3. Medical supplies are non-returnable once seals are broken.',
      generatedBy: 'Generated by DentaStock Nexus Enterprise v2.5',
      practiceName: 'Dr. Jane Smith Practice',
      practiceAddress: '42 Ortho Plaza, Algiers 16000',
      remaining: 'remaining',
      cachetEtSignature: 'STAMP AND SIGNATURE'
    },
    login: {
      medicalGateway: 'Medical Gateway',
      subtitle: 'Please authorize your session to access inventory controls.',
      email: 'Email Address',
      secretKey: 'Secret Key',
      establishConnection: 'Establish Connection',
      credentialsNotice: 'Provide your clinical credentials to establish a secure link.',
      clinicalManagement: 'Advanced Clinical Management',
      cryptoLayer: 'Secured by Nexus Crypto-Layer v4.0.2',
      errorConfig: 'Cloud authentication is not configured.'
    },
    cash: {
      title: 'Cash Management (Caisse)',
      subtitle: 'Track daily expenses and actual cash balance.',
      balance: 'Current Balance',
      transactions: 'Recent Transactions',
      addTransaction: 'Record Operation',
      description: 'Description',
      amount: 'Amount (DA)',
      type: 'Type',
      income: 'Income',
      expense: 'Expense',
      category: 'Category',
      date: 'Date',
      confirmDelete: 'Are you sure you want to delete this transaction?',
      noTransactions: 'No transactions recorded for this period.'
    }
  },
  fr: {
    common: {
      dashboard: 'Tableau de bord',
      products: 'Produits',
      categories: 'Catégories',
      clients: 'Clients',
      suppliers: 'Fournisseurs',
      client: 'Client',
      supplier: 'Fournisseur',
      invoices: 'Factures',
      medicalOfficer: 'Officier Médical',
      search: 'Rechercher',
      clear: 'Effacer',
      actions: 'Actions',
      add: 'Ajouter',
      save: 'Enregistrer',
      update: 'Mettre à jour',
      delete: 'Supprimer',
      cancel: 'Annuler',
      dismiss: 'Fermer',
      back: 'Retour',
      print: 'Imprimer',
      loading: 'Chargement...',
      type: 'Type',
      status: 'Statut',
      date: 'Date',
      total: 'Total',
      paid: 'Payé',
      pending: 'En attente',
      name: 'Nom',
      email: 'Email',
      phone: 'Téléphone',
      address: 'Adresse',
      category: 'Catégorie',
      price: 'Prix',
      cost: 'Coût',
      stock: 'Stock',
      minStock: 'Stock Min',
      sku: 'Référence (SKU)',
      expiryDate: 'Date d\'expiration',
      quantity: 'Quantité',
      subtotal: 'Sous-total',
      initializingPersistence: 'Initialisation du système...',
      confirmDelete: 'Confirmer la suppression',
      confirmDeleteMsg: 'Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.',
      confirm: 'Confirmer',
      currency: 'DA',
      ref: 'RÉF :'
    },
    nav: {
      overview: 'Aperçu',
      inventory: 'Inventaire',
      relations: 'Relations',
      finance: 'Finance',
      cash: 'La Caisse',
      newSale: 'Nouvelle Vente',
      endSession: 'Déconnexion'
    },
    dashboard: {
      overview: 'Aperçu du Cabinet',
      subtitle: 'Niveaux de fournitures cliniques et indicateurs opérationnels.',
      revenue: 'Chiffre d\'Affaires',
      profit: 'Bénéfice Clinique Est.',
      safetyAlerts: 'Alertes Sécurité',
      quickActions: 'Accès Rapides',
      newSale: 'Nouvelle Vente',
      newPurchase: 'Nouvel Achat',
      clinicalAlerts: 'Alertes Cliniques',
      expiringSoon: 'Expire bientôt',
      ofLines: 'sur {total} lignes',
      financialPerformance: 'Performance Financière (DA)',
      supplyDistribution: 'Distribution des Fournitures'
    },
    products: {
      title: 'Fournitures Dentaires',
      subtitle: 'Suivi des matériaux cliniques sur {count} articles.',
      registerNew: 'Enregistrer une Fourniture',
      searchPlaceholder: 'Rechercher par nom ou SKU...',
      allCategories: 'Toutes les Catégories',
      stockStatus: 'État du Stock',
      inStock: 'En Stock',
      lowStock: 'Stock Faible',
      outOfStock: 'Rupture de Stock',
      productInfo: 'Info Produit',
      classification: 'Classification',
      financials: 'Finances (DA)',
      safetyExpiry: 'Sécurité / Expiration',
      registerTitle: 'Enregistrer une Fourniture Dentaire',
      updateTitle: 'Mettre à jour la Fourniture',
      clinicalName: 'Nom Clinique du Produit',
      skuId: 'ID SKU / Code-barres',
      expirySafety: 'Date d\'Expiration (Sécurité)',
      retailPrice: 'Prix de Vente (DA)',
      purchaseCost: 'Coût d\'Achat (DA)',
      openingStock: 'Stock Initial',
      minAlert: 'Seuil d\'Alerte Min',
      commitChanges: 'Valider les Changements',
      completeRegistration: 'Terminer l\'Enregistrement',
      stockLevel: 'Niveau du stock',
      noMatch: 'Aucune fourniture ne correspond à votre recherche.',
      requestingCamera: 'Demande de la caméra...',
      accessRestricted: 'Accès limité',
      tryAgain: 'Réessayer',
      insecureContext: 'Contexte non sécurisé',
      scanNotice: 'Veuillez vérifier les autorisations du navigateur. Note : Le scan par caméra mobile nécessite une **connexion sécurisée (HTTPS)** ou un accès localhost.'
    },
    categories: {
      title: 'Catégories de Fournitures',
      subtitle: 'Organisez votre inventaire clinique en groupes gérables.',
      addCategory: 'Ajouter une Catégorie',
      newCategory: 'Nouvelle Catégorie',
      editCategory: 'Modifier la Catégorie',
      categoryId: 'ID de Classification',
      noCategories: 'Aucune catégorie définie. Ajoutez-en une pour organiser le stock.',
      deleteMessage: 'Voulez-vous vraiment supprimer cette catégorie ? Cette action est irréversible et peut affecter les produits associés.'
    },
    entities: {
      clients: {
        title: 'Répertoire des Clients',
        subtitle: 'Gestion de {count} comptes clients actifs.'
      },
      suppliers: {
        title: 'Répertoire des Fournisseurs',
        subtitle: 'Gestion de {count} comptes fournisseurs actifs.'
      },
      new: 'Nouveau {type}',
      store: 'Enregistrer {type}',
      displayName: 'Nom d\'Affichage',
      primaryPhone: 'Téléphone Principal',
      physicalAddress: 'Adresse Physique',
      outstandingBalance: 'Solde Restant',
      accountStatus: 'État du Compte',
      fullySettled: 'Entièrement Réglé'
    },
    invoices: {
      title: 'Grand Livre et Factures',
      subtitle: 'Historique des transactions (Montants en DA).',
      buyStock: 'Acheter du Stock',
      sellItems: 'Vendre des Articles',
      advancedFilters: 'Filtres Avancés',
      searchLedger: 'Chercher dans le Livre',
      dateRange: 'Période',
      to: 'au',
      classification: 'Classification',
      allTypes: 'Tous les Types',
      practiceSales: 'Ventes du Cabinet',
      supplyOrders: 'Commandes Fournisseurs',
      billingEntity: 'Entité de Facturation',
      allEntities: 'Toutes les Entités',
      reference: 'Référence Facture',
      balance: 'Solde (DA)',
      view: 'Voir',
      noResults: 'Aucune transaction ne correspond à votre sélection.',
      noResultsDetailed: 'Aucun résultat ne correspond à vos filtres cliniques.',
      clearFilters: 'Effacer les Filtres',
      proforma: 'Facture Proforma',
      purchaseOrder: 'Bon de Commande',
      finalInvoice: 'Facture Fiscale'
    },
    invoiceCreator: {
      system: 'Système de Facturation',
      postSale: 'Enregistrer Vente',
      postOrder: 'Enregistrer Commande',
      billingEntity: 'Entité de Facturation',
      chooseEntity: 'Choisir {type}...',
      finalTotal: 'Total Final (DA)',
      productItem: 'Produit / Article',
      lineTotal: 'Total Ligne',
      manualEntry: 'Saisie Manuelle',
      scanBarcode: 'Scanner Code-barres',
      verifyNotice: 'Vérifiez les stocks avant de valider. Cette action met à jour l\'inventaire permanent et ne peut pas être annulée via ce tableau de bord.',
      netPayable: 'Net à Payer',
      amountPaid: 'Montant Payé Aujourd\'hui (DA)',
      remainingDebt: 'Dette Restante',
      cameraAccessFailed: 'Impossible d\'accéder à la caméra. Veuillez vérifier les permissions.',
      scannedProductNotFound: 'Produit avec le SKU "{sku}" non trouvé dans l\'inventaire.',
      addProduct: 'Choisir un produit...',
      quantity: 'Quantité',
      unitPrice: 'Prix (DA)',
      subtotal: 'Sous-total'
    },
    invoiceDetail: {
      notFound: 'Facture non trouvée',
      returnLedger: 'Retour au Livre',
      printInvoice: 'Imprimer la Facture',
      medicalSupplySolutions: 'Solutions de Fournitures Médicales',
      billTo: 'Facturé à',
      totalPayable: 'Total à Payer',
      balanceDue: 'Solde Dû',
      recordPayment: 'Enregistrer Paiement',
      settleBalance: 'Régler le Solde',
      postPayment: 'Valider Paiement',
      authorizedSignature: 'Signature Autorisée',
      termsAndConditions: 'Conditions Générales',
      term1: '1. Veuillez indiquer le numéro de facture pour toutes les références de paiement.',
      term2: '2. Le paiement est dû dans les 30 jours, sauf accord contraire.',
      term3: '3. Les fournitures médicales ne sont pas retournables une fois les scellés brisés.',
      generatedBy: 'Généré par DentaStock Nexus Enterprise v2.5',
      practiceName: 'Cabinet du Dr. Jane Smith',
      practiceAddress: '42 Ortho Plaza, Alger 16000',
      remaining: 'restant',
      cachetEtSignature: 'CACHET ET SIGNATURE'
    },
    login: {
      medicalGateway: 'Portail Médical',
      subtitle: 'Veuillez autoriser votre session pour accéder aux contrôles d\'inventaire.',
      email: 'Adresse Email',
      secretKey: 'Clé Secrète',
      establishConnection: 'Établir la Connexion',
      credentialsNotice: 'Fournissez vos identifiants cliniques pour établir un lien sécurisé.',
      clinicalManagement: 'Gestion Clinique Avancée',
      cryptoLayer: 'Sécurisé par Nexus Crypto-Layer v4.0.2',
      errorConfig: 'L\'authentification cloud n\'est pas configurée.'
    },
    cash: {
      title: 'Gestion de la Caisse',
      subtitle: 'Suivi des dépenses quotidiennes et du solde réel.',
      balance: 'Solde Actuel',
      transactions: 'Transactions Récentes',
      addTransaction: 'Enregistrer une Opération',
      description: 'Description',
      amount: 'Montant (DA)',
      type: 'Type',
      income: 'Recette (Entrée)',
      expense: 'Dépense (Sortie)',
      category: 'Catégorie',
      date: 'Date',
      confirmDelete: 'Êtes-vous sûr de vouloir supprimer cette transaction ?',
      noTransactions: 'Aucune transaction enregistrée pour cette période.'
    }
  }
};
