export type Locale = "en" | "fr";

export type Messages = {
  quoteTitle: (from: string, to: string) => string;
  tagline: string;
  navAboutLabel: string;
  navFeesLabel: string;
  navSecurityLabel: string;
  navHelpLabel: string;
  navGetStartedLabel: string;
  heroWelcomeLabel: string;
  heroTitle: string;
  heroSubtitle: string;
  sendCardTitle: string;
  sendCardSubtitle: string;
  sendFromLabel: string;
  sendToLabel: string;
  sendCtaLabel: string;
  trustTitle: string;
  trustSignalsLabel: string;
  rateLockedAtLabel: string;
  feeRefundGuaranteeCopy: string;
  complianceCopy: string;
  trustItemTransparent: string;
  trustItemFast: string;
  trustItemSecure: string;
  featuresTitle: string;
  featuresSubtitle: string;
  featuresLinkLabel: string;
  featureSmartRoutingTitle: string;
  featureSmartRoutingDescription: string;
  featureMultiRailTitle: string;
  featureMultiRailDescription: string;
  featureTrackingTitle: string;
  featureTrackingDescription: string;
  faqTitle: string;
  faqSubtitle: string;
  faqQuestionOne: string;
  faqAnswerOne: string;
  faqQuestionTwo: string;
  faqAnswerTwo: string;
  faqQuestionThree: string;
  faqAnswerThree: string;
  faqQuestionFour: string;
  faqAnswerFour: string;
  countrySelectChangeLabel: string;
  countrySelectDialogTitle: string;
  countrySelectDialogSubtitle: string;
  countrySelectCloseLabel: string;
  countrySelectSearchPlaceholder: string;
  countrySelectSearchLabel: string;
  countrySelectNoResultsLabel: string;
  countrySelectFallbackLabel: string;
  footerTagline: string;
  footerCompanyLabel: string;
  footerProductLabel: string;
  footerResourcesLabel: string;
  footerSupportLabel: string;
  footerSendLinkLabel: string;
  footerFaqLinkLabel: string;
  footerContactLinkLabel: string;
  footerStatusLinkLabel: string;
  pricingControlsTitle: string;
  pricingControlsSubtitle: string;
  transferDetailsEmptyTitle: string;
  transferDetailsEmptyDescription: string;
  editSendDetailsLabel: string;
  quoteSectionSubtitle: string;
  assetsLoadError: string;
  assetsLoading: string;
  fromAssetLabel: string;
  toAssetLabel: string;
  railLabel: string;
  sendAmountLabel: string;
  sendAmountHint: string;
  marketRateLabel: string;
  fxMarginLabel: string;
  fixedFeeLabel: string;
  percentFeeLabel: string;
  percentFeeLabelWithAsset: (asset: string) => string;
  marketRatePending: string;
  appliedRatePending: string;
  marketRateSuffix: string;
  fixedFeeSuffix: string;
  recipientGetsLabel: string;
  quoteValidFor: (seconds: number) => string;
  quoteExpired: string;
  quoteFetching: string;
  refreshingQuote: string;
  waitingForQuote: string;
  basedOnAfterFees: (amount: string) => string;
  smartSuggestionsLabel: string;
  cheapestLabel: string;
  fastestLabel: string;
  bestValueLabel: string;
  routeHighlightLowestFee: string;
  routeHighlightFastestEta: string;
  routeHighlightHighestPayout: string;
  routeActiveLabel: string;
  etaRangeLabel: (minMinutes: number, maxMinutes: number) => string;
  useRouteButton: string;
  recommendationLoading: string;
  recommendationEmpty: string;
  recommendationLoadError: string;
  recommendationRecommendedLabel: string;
  recommendationOtherLabel: string;
  recommendationSingleLabel: string;
  recommendationReasonLabel: string;
  recommendationWhyRouteLabel: string;
  recommendationScoreFeeLabel: string;
  recommendationScorePayoutLabel: string;
  recommendationScoreEtaLabel: string;
  quoteBreakdownLabel: string;
  quoteIdLabel: string;
  expiresAtLabel: string;
  railDisplayLabel: string;
  sendAmountRow: string;
  totalFeeRow: string;
  netConvertedRow: string;
  appliedRateRow: string;
  fxMarginRow: string;
  effectiveRateRow: string;
  feesLabel: string;
  lockQuoteButton: string;
  lockQuoteRefreshing: string;
  refreshQuoteButton: string;
  transferDetailsLabel: string;
  lockedQuoteLabel: string;
  draftLabel: string;
  recipientNameLabel: string;
  recipientCountryLabel: string;
  recipientPhoneLabel: string;
  payoutRailLabel: string;
  bankNameLabel: string;
  bankAccountLabel: string;
  mobileMoneyProviderLabel: string;
  mobileMoneyNumberLabel: string;
  memoLabel: string;
  lightningEducationTitle: string;
  lightningEducationBody: string;
  createTransferButton: string;
  transferSubmitting: string;
  transferCreatedLabel: string;
  transferStatusLabel: string;
  transferIdLabel: string;
  statusReadyLabel: string;
  statusProcessingLabel: string;
  statusCompletedLabel: string;
  statusFailedLabel: string;
  statusCanceledLabel: string;
  statusDraftLabel: string;
  statusExpiredLabel: string;
  viewReceiptButton: string;
  transferReceiptTitle: string;
  referenceCodeLabel: string;
  trackTransferLinkLabel: string;
  copyReferenceButton: string;
  copyLinkButton: string;
  copiedLabel: string;
  timelineLabel: string;
  timelineEmptyLabel: string;
  recipientSummaryLabel: string;
  payoutSummaryLabel: string;
  payoutRailBankLabel: string;
  payoutRailMobileMoneyLabel: string;
  payoutRailLightningLabel: string;
  lockedQuoteSummaryLabel: string;
  receiptSendAmountLabel: string;
  receiptAppliedRateLabel: string;
  receiptTotalFeesLabel: string;
  receiptRecipientGetsLabel: string;
  receiptLoadingLabel: string;
  receiptLoadError: string;
  receiptNotFoundLabel: string;
  receiptExpiredLabel: string;
  receiptBackHomeButton: string;
  lightningInvoiceLabel: string;
  lightningAmountLabel: string;
  lightningStatusLabel: string;
  lightningWaitingLabel: string;
  lightningPaidLabel: string;
  copyInvoiceButton: string;
  simulatePaymentButton: string;
  transferCreatedEvent: string;
  invoiceIssuedEvent: string;
  quoteLockedEvent: (expiresAt: string) => string;
  transferProcessingEvent: string;
  transferCompletedEvent: string;
  transferPaidEvent: string;
  transferFailedEvent: string;
  transferCanceledEvent: string;
  trackTitle: string;
  trackSubtitle: string;
  trackHelperText: string;
  trackInputLabel: string;
  trackInputPlaceholder: string;
  trackSubmitLabel: string;
  trackNotFoundLabel: string;
  trackErrorLabel: string;
  trackBackHomeButton: string;
  languageToggleLabel: string;
  languageEnLabel: string;
  languageFrLabel: string;
  transferReadyMessage: string;
  transferIncompleteMessage: string;
  recipientNameRequired: string;
  recipientCountryRequired: string;
  recipientCountryInvalid: string;
  recipientPhoneInvalid: string;
  payoutRailRequired: string;
  bankDetailsRequired: string;
  mobileMoneyDetailsRequired: string;
  lockQuoteRefreshFailed: string;
  lockQuoteExpired: string;
  lockQuoteUpdated: string;
  quoteLoadError: string;
  transferCreateError: string;
  transferUpdateError: string;
  quoteExpiredError: string;
  invalidQuoteError: string;
};

const EN_MESSAGES: Messages = {
  quoteTitle: (from, to) => `${from} to ${to} Quote`,
  tagline: "Send with clarity.",
  navAboutLabel: "About",
  navFeesLabel: "Fees",
  navSecurityLabel: "Security",
  navHelpLabel: "Help",
  navGetStartedLabel: "Get started",
  heroWelcomeLabel: "Welcome to ClariSend",
  heroTitle: "Send with clarity. Know the rate, fees, and arrival time upfront.",
  heroSubtitle:
    "Transparent pricing, smart routing, and modern payout rails for predictable transfers.",
  sendCardTitle: "Send money",
  sendCardSubtitle: "Start a quote in seconds with clear fees.",
  sendFromLabel: "Sending from",
  sendToLabel: "Sending to",
  sendCtaLabel: "Start transfer",
  trustTitle: "Trusted for clarity at every step",
  trustSignalsLabel: "Trust & compliance",
  rateLockedAtLabel: "Rate locked at",
  feeRefundGuaranteeCopy: "Fee refund guarantee if we miss the quoted ETA.",
  complianceCopy: "Non-custodial. Encrypted end-to-end with compliance controls.",
  trustItemTransparent: "Transparent pricing",
  trustItemFast: "Fast delivery",
  trustItemSecure: "Secure & compliant",
  featuresTitle: "Designed for modern remittances",
  featuresSubtitle:
    "Smart rails, real-time updates, and routing intelligence that keeps transfers on track.",
  featuresLinkLabel: "Features",
  featureSmartRoutingTitle: "Smart routing",
  featureSmartRoutingDescription:
    "Automatically pick the best route based on total cost, speed, and payout reliability.",
  featureMultiRailTitle: "Multi-rail payout",
  featureMultiRailDescription:
    "Deliver to bank, mobile money, or lightning rails with consistent customer experiences.",
  featureTrackingTitle: "Tracking",
  featureTrackingDescription:
    "Live status updates and receipts keep senders and recipients aligned end to end.",
  faqTitle: "Frequently asked questions",
  faqSubtitle: "Clear answers before you send.",
  faqQuestionOne: "How does ClariSend keep pricing transparent?",
  faqAnswerOne:
    "We show the live rate, FX margin, and all fees before you lock your quote. No surprises at payout.",
  faqQuestionTwo: "What payout rails do you support?",
  faqAnswerTwo:
    "ClariSend supports bank, mobile money, and lightning payouts depending on the corridor.",
  faqQuestionThree: "How fast are transfers?",
  faqAnswerThree:
    "Delivery times vary by rail and provider, but you will see ETA ranges before you send.",
  faqQuestionFour: "Is ClariSend compliant and secure?",
  faqAnswerFour:
    "Yes. We follow strict compliance controls and keep transfer data encrypted end to end.",
  countrySelectChangeLabel: "Change",
  countrySelectDialogTitle: "Choose a country and currency",
  countrySelectDialogSubtitle: "Search by country, currency, or code.",
  countrySelectCloseLabel: "Close",
  countrySelectSearchPlaceholder: "Search country or currency",
  countrySelectSearchLabel: "Search country",
  countrySelectNoResultsLabel: "No matches found. Try another search.",
  countrySelectFallbackLabel: "Select country",
  footerTagline:
    "Transparent global payments and remittances built for teams that demand clarity.",
  footerCompanyLabel: "Company",
  footerProductLabel: "Product",
  footerResourcesLabel: "Resources",
  footerSupportLabel: "Support",
  footerSendLinkLabel: "Send money",
  footerFaqLinkLabel: "FAQ",
  footerContactLinkLabel: "Contact",
  footerStatusLinkLabel: "System status",
  pricingControlsTitle: "Pricing controls",
  pricingControlsSubtitle: "Adjust rates and fees if you need to preview alternatives.",
  transferDetailsEmptyTitle: "Lock a quote to add recipient details.",
  transferDetailsEmptyDescription:
    "Once locked, you can enter recipient information and confirm the payout rail.",
  editSendDetailsLabel: "Edit send details",
  quoteSectionSubtitle: "Review your quote, lock it, and confirm recipient details.",
  assetsLoadError: "Unable to load assets. Showing defaults.",
  assetsLoading: "Fetching available assets...",
  fromAssetLabel: "From asset",
  toAssetLabel: "To asset",
  railLabel: "Rail",
  sendAmountLabel: "Send amount",
  sendAmountHint: "Enter a value to preview fees and recipient payout.",
  marketRateLabel: "Market rate",
  fxMarginLabel: "FX margin (%)",
  fixedFeeLabel: "Fixed fee",
  percentFeeLabel: "Percent fee",
  percentFeeLabelWithAsset: (asset) => `Percent fee (% of ${asset})`,
  marketRatePending: "Market rate pending",
  appliedRatePending: "Applied rate pending",
  marketRateSuffix: "market",
  fixedFeeSuffix: "fixed",
  recipientGetsLabel: "Recipient Gets",
  quoteValidFor: (seconds) => `Valid for ${seconds}s`,
  quoteExpired: "Expired",
  quoteFetching: "Fetching quote...",
  refreshingQuote: "Refreshing quote...",
  waitingForQuote: "Waiting for quote response.",
  basedOnAfterFees: (amount) => `Based on ${amount} after fees.`,
  smartSuggestionsLabel: "Smart Suggestions",
  cheapestLabel: "Cheapest",
  fastestLabel: "Fastest",
  bestValueLabel: "Best Value",
  routeHighlightLowestFee: "Lowest total fee",
  routeHighlightFastestEta: "Fastest ETA",
  routeHighlightHighestPayout: "Highest recipient payout",
  routeActiveLabel: "Active route",
  etaRangeLabel: (minMinutes, maxMinutes) => `${minMinutes}-${maxMinutes} min ETA`,
  useRouteButton: "Use this route",
  recommendationLoading: "Fetching smart suggestions...",
  recommendationEmpty: "Enter an amount to see tailored routes.",
  recommendationLoadError: "We couldn't load suggestions right now. Please try again.",
  recommendationRecommendedLabel: "Recommended",
  recommendationOtherLabel: "Other options",
  recommendationSingleLabel:
    "Only a few routes are available for this corridor right now.",
  recommendationReasonLabel: "Why this route",
  recommendationWhyRouteLabel: "Why this route?",
  recommendationScoreFeeLabel: "Fee",
  recommendationScorePayoutLabel: "Payout",
  recommendationScoreEtaLabel: "ETA",
  quoteBreakdownLabel: "Quote Breakdown",
  quoteIdLabel: "Quote ID",
  expiresAtLabel: "Expires at",
  railDisplayLabel: "Rail",
  sendAmountRow: "Send amount",
  totalFeeRow: "Total fee",
  netConvertedRow: "Net converted",
  appliedRateRow: "Applied rate",
  fxMarginRow: "FX margin",
  effectiveRateRow: "Effective rate",
  feesLabel: "Fees",
  lockQuoteButton: "Lock quote",
  lockQuoteRefreshing: "Refreshing quote...",
  refreshQuoteButton: "Refresh quote",
  transferDetailsLabel: "Transfer details",
  lockedQuoteLabel: "Locked quote",
  draftLabel: "Draft",
  recipientNameLabel: "Recipient name",
  recipientCountryLabel: "Recipient country",
  recipientPhoneLabel: "Recipient phone",
  payoutRailLabel: "Payout rail",
  bankNameLabel: "Bank name",
  bankAccountLabel: "Bank account",
  mobileMoneyProviderLabel: "Mobile money provider",
  mobileMoneyNumberLabel: "Mobile money number",
  memoLabel: "Memo (optional)",
  lightningEducationTitle: "What is Lightning?",
  lightningEducationBody:
    "Lightning is a Bitcoin payment network that settles instantly with low fees. It keeps funds non-custodial and final once paid.",
  createTransferButton: "Create transfer",
  transferSubmitting: "Creating transfer...",
  transferCreatedLabel: "Transfer created",
  transferStatusLabel: "Status",
  transferIdLabel: "Transfer ID",
  statusReadyLabel: "Ready",
  statusProcessingLabel: "Processing",
  statusCompletedLabel: "Completed",
  statusFailedLabel: "Failed",
  statusCanceledLabel: "Canceled",
  statusDraftLabel: "Draft",
  statusExpiredLabel: "Expired",
  viewReceiptButton: "View receipt",
  transferReceiptTitle: "Transfer receipt",
  referenceCodeLabel: "Reference",
  trackTransferLinkLabel: "Track transfer",
  copyReferenceButton: "Copy reference",
  copyLinkButton: "Copy link",
  copiedLabel: "Copied",
  timelineLabel: "Timeline",
  timelineEmptyLabel: "No timeline events yet.",
  recipientSummaryLabel: "Recipient",
  payoutSummaryLabel: "Payout rail",
  payoutRailBankLabel: "Bank transfer",
  payoutRailMobileMoneyLabel: "Mobile money",
  payoutRailLightningLabel: "Lightning",
  lockedQuoteSummaryLabel: "Locked quote breakdown",
  receiptSendAmountLabel: "Send amount",
  receiptAppliedRateLabel: "Applied rate",
  receiptTotalFeesLabel: "Total fees",
  receiptRecipientGetsLabel: "Recipient gets",
  receiptLoadingLabel: "Loading receipt...",
  receiptLoadError: "Unable to load receipt. Please try again.",
  receiptNotFoundLabel: "Transfer not found.",
  receiptExpiredLabel: "Transfer expired.",
  receiptBackHomeButton: "Back to home",
  lightningInvoiceLabel: "Lightning invoice",
  lightningAmountLabel: "Invoice amount (sats)",
  lightningStatusLabel: "Lightning status",
  lightningWaitingLabel: "Waiting for payment",
  lightningPaidLabel: "Paid",
  copyInvoiceButton: "Copy invoice",
  simulatePaymentButton: "Simulate payment",
  transferCreatedEvent: "Transfer created",
  invoiceIssuedEvent: "Lightning invoice issued",
  quoteLockedEvent: (expiresAt) => `Quote locked until ${expiresAt}`,
  transferProcessingEvent: "Transfer is being processed",
  transferCompletedEvent: "Transfer completed successfully",
  transferPaidEvent: "Lightning invoice paid",
  transferFailedEvent: "Transfer failed",
  transferCanceledEvent: "Transfer canceled",
  trackTitle: "Track transfer",
  trackSubtitle: "Follow your transfer by reference code.",
  trackHelperText:
    "Enter the reference from your receipt to view the live timeline and status.",
  trackInputLabel: "Reference code",
  trackInputPlaceholder: "CS-7K9X2A",
  trackSubmitLabel: "Find transfer",
  trackNotFoundLabel: "We couldn't find a transfer with that reference.",
  trackErrorLabel: "Unable to fetch transfer status right now.",
  trackBackHomeButton: "Back to home",
  languageToggleLabel: "Language",
  languageEnLabel: "EN",
  languageFrLabel: "FR",
  transferReadyMessage: "Details look good. Ready to submit.",
  transferIncompleteMessage: "Complete recipient details to continue.",
  recipientNameRequired: "Recipient name is required.",
  recipientCountryRequired: "Recipient country is required.",
  recipientCountryInvalid: "Use a 2-letter ISO code.",
  recipientPhoneInvalid: "Enter a valid phone number.",
  payoutRailRequired: "Select a payout rail.",
  bankDetailsRequired: "Bank name and account are required.",
  mobileMoneyDetailsRequired: "Provider and number are required.",
  lockQuoteRefreshFailed: "Unable to refresh quote. Please try again.",
  lockQuoteExpired: "Quote expired. Refresh and try again.",
  lockQuoteUpdated: "Quote updated. Lock again to continue.",
  quoteLoadError: "Unable to load quote. Please try again.",
  transferCreateError: "Unable to create transfer. Please try again.",
  transferUpdateError: "Unable to update transfer. Please try again.",
  quoteExpiredError: "Quote expired. Refresh and lock again.",
  invalidQuoteError: "Lock a valid quote before continuing.",
};

const FR_MESSAGES: Messages = {
  quoteTitle: (from, to) => `De ${from} à ${to}`,
  tagline: "Envoyez en toute clarté.",
  navAboutLabel: "À propos",
  navFeesLabel: "Frais",
  navSecurityLabel: "Sécurité",
  navHelpLabel: "Aide",
  navGetStartedLabel: "Commencer",
  heroWelcomeLabel: "Bienvenue chez ClariSend",
  heroTitle:
    "Envoyez en toute clarté. Connaissez le taux, les frais et le délai avant d'envoyer.",
  heroSubtitle:
    "Tarifs transparents, routage intelligent et rails modernes pour des transferts prévisibles.",
  sendCardTitle: "Envoyer de l'argent",
  sendCardSubtitle: "Lancez un devis en quelques secondes avec des frais clairs.",
  sendFromLabel: "Envoi depuis",
  sendToLabel: "Envoi vers",
  sendCtaLabel: "Démarrer le transfert",
  trustTitle: "La clarté à chaque étape",
  trustSignalsLabel: "Confiance & conformité",
  rateLockedAtLabel: "Taux verrouillé à",
  feeRefundGuaranteeCopy:
    "Garantie de remboursement des frais si l’ETA annoncée n’est pas respectée.",
  complianceCopy:
    "Non-custodial. Données chiffrées de bout en bout avec contrôles de conformité.",
  trustItemTransparent: "Tarification transparente",
  trustItemFast: "Livraison rapide",
  trustItemSecure: "Sécurisé et conforme",
  featuresTitle: "Conçu pour les envois modernes",
  featuresSubtitle:
    "Rails intelligents, mises à jour en temps réel et routage optimisé pour garder vos transferts sur la bonne voie.",
  featuresLinkLabel: "Fonctionnalités",
  featureSmartRoutingTitle: "Routage intelligent",
  featureSmartRoutingDescription:
    "Sélection automatique du meilleur itinéraire selon le coût total, la vitesse et la fiabilité.",
  featureMultiRailTitle: "Paiement multi-rail",
  featureMultiRailDescription:
    "Livrez sur banques, mobile money ou lightning avec une expérience cohérente.",
  featureTrackingTitle: "Suivi",
  featureTrackingDescription:
    "Des statuts en direct et des reçus gardent tout le monde aligné.",
  faqTitle: "Questions fréquentes",
  faqSubtitle: "Des réponses claires avant d'envoyer.",
  faqQuestionOne: "Comment ClariSend garantit-il la transparence des prix ?",
  faqAnswerOne:
    "Nous affichons le taux en direct, la marge FX et tous les frais avant de verrouiller le devis.",
  faqQuestionTwo: "Quels rails de paiement supportez-vous ?",
  faqAnswerTwo:
    "ClariSend prend en charge les virements bancaires, mobile money et lightning selon les corridors.",
  faqQuestionThree: "Quels sont les délais de transfert ?",
  faqAnswerThree:
    "Les délais varient selon le rail et le fournisseur, mais vous voyez l'ETA avant d'envoyer.",
  faqQuestionFour: "ClariSend est-il conforme et sécurisé ?",
  faqAnswerFour:
    "Oui. Nous appliquons des contrôles de conformité stricts et chiffrons les données.",
  countrySelectChangeLabel: "Modifier",
  countrySelectDialogTitle: "Choisissez un pays et une devise",
  countrySelectDialogSubtitle: "Recherchez par pays, devise ou code.",
  countrySelectCloseLabel: "Fermer",
  countrySelectSearchPlaceholder: "Rechercher un pays ou une devise",
  countrySelectSearchLabel: "Rechercher un pays",
  countrySelectNoResultsLabel: "Aucun résultat. Essayez une autre recherche.",
  countrySelectFallbackLabel: "Choisir un pays",
  footerTagline:
    "Paiements internationaux transparents, pensés pour les équipes qui exigent la clarté.",
  footerCompanyLabel: "Entreprise",
  footerProductLabel: "Produit",
  footerResourcesLabel: "Ressources",
  footerSupportLabel: "Support",
  footerSendLinkLabel: "Envoyer de l'argent",
  footerFaqLinkLabel: "FAQ",
  footerContactLinkLabel: "Contact",
  footerStatusLinkLabel: "État du système",
  pricingControlsTitle: "Contrôles de tarification",
  pricingControlsSubtitle:
    "Ajustez les taux et les frais pour simuler des alternatives.",
  transferDetailsEmptyTitle: "Verrouillez un devis pour saisir le bénéficiaire.",
  transferDetailsEmptyDescription:
    "Une fois verrouillé, vous pouvez saisir les informations du bénéficiaire et confirmer le rail.",
  editSendDetailsLabel: "Modifier les détails",
  quoteSectionSubtitle:
    "Vérifiez votre devis, verrouillez-le et confirmez les détails du bénéficiaire.",
  assetsLoadError: "Impossible de charger les actifs. Valeurs par défaut affichées.",
  assetsLoading: "Chargement des devises...",
  fromAssetLabel: "Actif d'envoi",
  toAssetLabel: "Actif de réception",
  railLabel: "Rail",
  sendAmountLabel: "Montant envoyé",
  sendAmountHint: "Saisissez un montant pour prévisualiser les frais et le montant reçu.",
  marketRateLabel: "Taux du marché",
  fxMarginLabel: "Marge FX (%)",
  fixedFeeLabel: "Frais fixes",
  percentFeeLabel: "Frais en pourcentage",
  percentFeeLabelWithAsset: (asset) => `Frais en pourcentage (% de ${asset})`,
  marketRatePending: "Taux du marché en attente",
  appliedRatePending: "Taux appliqué en attente",
  marketRateSuffix: "marché",
  fixedFeeSuffix: "fixes",
  recipientGetsLabel: "Le bénéficiaire reçoit",
  quoteValidFor: (seconds) => `Valide pendant ${seconds}s`,
  quoteExpired: "Expiré",
  quoteFetching: "Devis en cours...",
  refreshingQuote: "Actualisation du devis...",
  waitingForQuote: "En attente du devis.",
  basedOnAfterFees: (amount) => `Basé sur ${amount} après frais.`,
  smartSuggestionsLabel: "Suggestions intelligentes",
  cheapestLabel: "Moins cher",
  fastestLabel: "Plus rapide",
  bestValueLabel: "Meilleure valeur",
  routeHighlightLowestFee: "Frais totaux les plus bas",
  routeHighlightFastestEta: "ETA la plus rapide",
  routeHighlightHighestPayout: "Montant reçu le plus élevé",
  routeActiveLabel: "Itinéraire actif",
  etaRangeLabel: (minMinutes, maxMinutes) =>
    `${minMinutes}-${maxMinutes} min ETA`,
  useRouteButton: "Utiliser cet itinéraire",
  recommendationLoading: "Chargement des suggestions...",
  recommendationEmpty: "Saisissez un montant pour voir les itinéraires.",
  recommendationLoadError:
    "Impossible de charger les suggestions pour le moment. Réessayez.",
  recommendationRecommendedLabel: "Recommandé",
  recommendationOtherLabel: "Autres options",
  recommendationSingleLabel:
    "Quelques options seulement sont disponibles pour ce corridor actuellement.",
  recommendationReasonLabel: "Pourquoi cet itinéraire",
  recommendationWhyRouteLabel: "Pourquoi cet itinéraire ?",
  recommendationScoreFeeLabel: "Frais",
  recommendationScorePayoutLabel: "Montant reçu",
  recommendationScoreEtaLabel: "Délai",
  quoteBreakdownLabel: "Détail du devis",
  quoteIdLabel: "ID du devis",
  expiresAtLabel: "Expire le",
  railDisplayLabel: "Rail",
  sendAmountRow: "Montant envoyé",
  totalFeeRow: "Frais totaux",
  netConvertedRow: "Net converti",
  appliedRateRow: "Taux appliqué",
  fxMarginRow: "Marge FX",
  effectiveRateRow: "Taux effectif",
  feesLabel: "Frais",
  lockQuoteButton: "Verrouiller le devis",
  lockQuoteRefreshing: "Actualisation du devis...",
  refreshQuoteButton: "Rafraîchir le devis",
  transferDetailsLabel: "Détails du transfert",
  lockedQuoteLabel: "Devis verrouillé",
  draftLabel: "Brouillon",
  recipientNameLabel: "Nom du bénéficiaire",
  recipientCountryLabel: "Pays du bénéficiaire",
  recipientPhoneLabel: "Téléphone du bénéficiaire",
  payoutRailLabel: "Rail de paiement",
  bankNameLabel: "Nom de la banque",
  bankAccountLabel: "Compte bancaire",
  mobileMoneyProviderLabel: "Opérateur mobile money",
  mobileMoneyNumberLabel: "Numéro mobile money",
  memoLabel: "Mémo (facultatif)",
  lightningEducationTitle: "Qu’est-ce que Lightning ?",
  lightningEducationBody:
    "Lightning est un réseau Bitcoin qui règle les paiements instantanément avec peu de frais. Les fonds restent non-custodial et finalisés après paiement.",
  createTransferButton: "Créer un transfert",
  transferSubmitting: "Création du transfert...",
  transferCreatedLabel: "Transfert créé",
  transferStatusLabel: "Statut",
  transferIdLabel: "ID du transfert",
  statusReadyLabel: "Prêt",
  statusProcessingLabel: "En traitement",
  statusCompletedLabel: "Terminé",
  statusFailedLabel: "Échoué",
  statusCanceledLabel: "Annulé",
  statusDraftLabel: "Brouillon",
  statusExpiredLabel: "Expiré",
  viewReceiptButton: "Voir le reçu",
  transferReceiptTitle: "Reçu de transfert",
  referenceCodeLabel: "Référence",
  trackTransferLinkLabel: "Suivre le transfert",
  copyReferenceButton: "Copier la référence",
  copyLinkButton: "Copier le lien",
  copiedLabel: "Copié",
  timelineLabel: "Chronologie",
  timelineEmptyLabel: "Aucun événement pour le moment.",
  recipientSummaryLabel: "Bénéficiaire",
  payoutSummaryLabel: "Rail de paiement",
  payoutRailBankLabel: "Virement bancaire",
  payoutRailMobileMoneyLabel: "Mobile money",
  payoutRailLightningLabel: "Lightning",
  lockedQuoteSummaryLabel: "Détail du devis verrouillé",
  receiptSendAmountLabel: "Montant envoyé",
  receiptAppliedRateLabel: "Taux appliqué",
  receiptTotalFeesLabel: "Frais totaux",
  receiptRecipientGetsLabel: "Montant reçu",
  receiptLoadingLabel: "Chargement du reçu...",
  receiptLoadError: "Impossible de charger le reçu. Veuillez réessayer.",
  receiptNotFoundLabel: "Transfert introuvable.",
  receiptExpiredLabel: "Transfert expiré.",
  receiptBackHomeButton: "Retour à l'accueil",
  lightningInvoiceLabel: "Facture Lightning",
  lightningAmountLabel: "Montant de la facture (sats)",
  lightningStatusLabel: "Statut Lightning",
  lightningWaitingLabel: "En attente du paiement",
  lightningPaidLabel: "Payé",
  copyInvoiceButton: "Copier la facture",
  simulatePaymentButton: "Simuler le paiement",
  transferCreatedEvent: "Transfert créé",
  invoiceIssuedEvent: "Facture Lightning émise",
  quoteLockedEvent: (expiresAt) => `Devis verrouillé jusqu’au ${expiresAt}`,
  transferProcessingEvent: "Le transfert est en cours de traitement",
  transferCompletedEvent: "Transfert terminé avec succès",
  transferPaidEvent: "Facture Lightning payée",
  transferFailedEvent: "Transfert échoué",
  transferCanceledEvent: "Transfert annulé",
  trackTitle: "Suivre un transfert",
  trackSubtitle: "Suivez votre transfert avec la référence.",
  trackHelperText:
    "Saisissez la référence de votre reçu pour voir la chronologie et le statut.",
  trackInputLabel: "Code de référence",
  trackInputPlaceholder: "CS-7K9X2A",
  trackSubmitLabel: "Trouver le transfert",
  trackNotFoundLabel: "Aucun transfert trouvé avec cette référence.",
  trackErrorLabel: "Impossible d’afficher le statut du transfert pour le moment.",
  trackBackHomeButton: "Retour à l’accueil",
  languageToggleLabel: "Langue",
  languageEnLabel: "EN",
  languageFrLabel: "FR",
  transferReadyMessage: "Les informations sont correctes. Prêt à envoyer.",
  transferIncompleteMessage: "Complétez les informations du bénéficiaire pour continuer.",
  recipientNameRequired: "Le nom du bénéficiaire est requis.",
  recipientCountryRequired: "Le pays du bénéficiaire est requis.",
  recipientCountryInvalid: "Utilisez un code ISO à 2 lettres.",
  recipientPhoneInvalid: "Entrez un numéro de téléphone valide.",
  payoutRailRequired: "Sélectionnez un rail de paiement.",
  bankDetailsRequired: "Le nom de la banque et le compte sont requis.",
  mobileMoneyDetailsRequired: "L’opérateur et le numéro sont requis.",
  lockQuoteRefreshFailed: "Impossible d’actualiser le devis. Veuillez réessayer.",
  lockQuoteExpired: "Devis expiré. Actualisez et réessayez.",
  lockQuoteUpdated: "Devis mis à jour. Verrouillez à nouveau pour continuer.",
  quoteLoadError: "Impossible de charger le devis. Veuillez réessayer.",
  transferCreateError: "Impossible de créer le transfert. Veuillez réessayer.",
  transferUpdateError: "Impossible de mettre à jour le transfert. Veuillez réessayer.",
  quoteExpiredError: "Devis expiré. Actualisez et verrouillez à nouveau.",
  invalidQuoteError: "Verrouillez un devis valide avant de continuer.",
};

export function getMessages(locale: Locale) {
  return locale === "fr" ? FR_MESSAGES : EN_MESSAGES;
}
