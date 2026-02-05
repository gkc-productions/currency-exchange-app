export type Locale = "en" | "fr";

export type Messages = {
  quoteTitle: (from: string, to: string) => string;
  tagline: string;
  navAboutLabel: string;
  navFeesLabel: string;
  navSecurityLabel: string;
  navHelpLabel: string;
  navGetStartedLabel: string;
  navDashboardLabel: string;
  navSignInLabel: string;
  navSignOutLabel: string;
  loginTitle: string;
  loginSubtitle: string;
  loginEmailLabel: string;
  loginEmailPlaceholder: string;
  loginButton: string;
  loginSentTitle: string;
  loginSentDescription: string;
  loginError: string;
  dashboardTitle: string;
  dashboardSubtitle: string;
  dashboardEmptyTitle: string;
  dashboardEmptyDescription: string;
  recipientsTitle: string;
  recipientsSubtitle: string;
  recipientsEmptyTitle: string;
  recipientsEmptyDescription: string;
  recipientsCreateTitle: string;
  recipientsSaveButton: string;
  recipientRemoveButton: string;
  recipientSelectLabel: string;
  recipientSelectPlaceholder: string;
  recipientSelectHelper: string;
  recipientAuthHelper: string;
  recipientSaveToggleLabel: string;
  recipientSaveSuccess: string;
  recipientSaveError: string;
  recipientLoadError: string;
  recipientLightningInvoiceLabel: string;
  receiptResendButton: string;
  receiptResendLoading: string;
  receiptResendSuccess: string;
  receiptResendError: string;
  receiptResendRateLimited: string;
  receiptGetButtonLabel: string;
  receiptGetPromptLabel: string;
  receiptAvailableAfterCompletionLabel: string;
  receiptSnapshotUnavailableLabel: string;
  receiptUnauthorizedLabel: string;
  receiptReadyLabel: string;
  payoutRefLabel: string;
  payoutReasonLabel: string;
  reconciliationTitle: string;
  reconciliationTransferIdLabel: string;
  reconciliationStatusLabel: string;
  reconciliationProviderLabel: string;
  reconciliationProviderPayoutIdLabel: string;
  reconciliationProviderStatusLabel: string;
  reconciliationUpdatedAtLabel: string;
  reconciliationUnavailableLabel: string;
  reconcilePayoutTitleLabel: string;
  reconcilePayoutButtonLabel: string;
  reconcilePayoutLoadingLabel: string;
  reconcilePayoutSuccessLabel: string;
  reconcilePayoutErrorLabel: string;
  reconcilePayoutNotProcessingLabel: string;
  reconcilePayoutMissingProviderLabel: string;
  reconcilePayoutProviderStatusLabel: string;
  payoutDiagnosticsTitle: string;
  payoutDiagnosticsEmptyLabel: string;
  payoutDiagnosticsAttemptLabel: string;
  payoutDiagnosticsProviderLabel: string;
  payoutDiagnosticsStatusLabel: string;
  payoutDiagnosticsRefLabel: string;
  payoutDiagnosticsStartedLabel: string;
  payoutDiagnosticsFinishedLabel: string;
  payoutDiagnosticsErrorLabel: string;
  providerLabel: string;
  providerStatusLabel: string;
  providerPayoutIdLabel: string;
  providerUpdatedAtLabel: string;
  adminTitle: string;
  adminSubtitle: string;
  adminUnauthorizedTitle: string;
  adminUnauthorizedDescription: string;
  adminPayoutsTitle: string;
  adminPayoutsSubtitle: string;
  adminPayoutsEmpty: string;
  adminPayoutsLoadingLabel: string;
  adminPayoutsAllLabel: string;
  adminPayoutsReferenceLabel: string;
  adminPayoutsStatusLabel: string;
  adminPayoutsRailLabel: string;
  adminPayoutsUpdatedLabel: string;
  adminPayoutsLatestEventLabel: string;
  adminPayoutsReceiptLabel: string;
  adminPayoutsReceiptViewLabel: string;
  adminPayoutsReceiptUnavailableLabel: string;
  adminPayoutsEventEmptyLabel: string;
  adminPayoutsProviderLabel: string;
  adminPayoutsRefreshLabel: string;
  adminPayoutsLoadError: string;
  adminPayoutsFromLabel: string;
  adminPayoutsToLabel: string;
  adminPayoutsDownloadCsvLabel: string;
  adminProvidersTitle: string;
  adminProvidersSubtitle: string;
  adminProvidersEmpty: string;
  adminProvidersEnabledLabel: string;
  adminProvidersHealthyLabel: string;
  adminProvidersNoErrorLabel: string;
  adminProvidersLoadError: string;
  adminProvidersUpdateError: string;
  heroTitle: string;
  heroSubtitle: string;
  sendCardTitle: string;
  sendCardSubtitle: string;
  sendFromLabel: string;
  sendToLabel: string;
  sendCtaLabel: string;
  primaryCorridorNote: string;
  secondaryCorridorNote: string;
  trustTitle: string;
  trustItemTransparent: string;
  trustItemFast: string;
  trustItemSecure: string;
  trustEncryptionLabel: string;
  trustSecureConnectionLabel: string;
  trustRegulatoryIntentLabel: string;
  flowStepsTitle: string;
  flowStepQuote: string;
  flowStepReview: string;
  flowStepTransfer: string;
  flowStepReceipt: string;
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
  quoteExpiredNotice: string;
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
  recommendationWhyLabel: string;
  quoteBreakdownLabel: string;
  quoteIdLabel: string;
  expiresAtLabel: string;
  rateSourceLabel: string;
  rateUpdatedLabel: string;
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
  createdAtLabel: string;
  updatedAtLabel: string;
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
  executePayoutButtonLabel: string;
  executePayoutRetryLabel: string;
  executePayoutLoadingLabel: string;
  executePayoutErrorLabel: string;
  executePayoutCooldownLabel: (seconds: number) => string;
  executePayoutExhaustedLabel: string;
  executePayoutProcessingLabel: string;
  executePayoutFailedLabel: string;
  retryPayoutLoadingLabel: string;
  retryPayoutErrorLabel: string;
  cancelPayoutButtonLabel: string;
  cancelPayoutLoadingLabel: string;
  cancelPayoutErrorLabel: string;
  lifecycleTitle: string;
  lifecycleCreatedLabel: string;
  lifecycleQuotedLabel: string;
  lifecycleInitiatedLabel: string;
  lifecyclePendingLabel: string;
  lifecycleCompletedLabel: string;
  lifecycleFailedLabel: string;
  lifecycleExpiredLabel: string;
  lifecycleCreatedDescription: string;
  lifecycleQuotedDescription: string;
  lifecycleInitiatedDescription: string;
  lifecyclePendingDescription: string;
  lifecycleCompletedDescription: string;
  lifecycleFailedDescription: string;
  lifecycleExpiredDescription: string;
  nextStepTitle: string;
  nextStepReady: string;
  nextStepProcessing: string;
  nextStepCompleted: string;
  nextStepFailed: string;
  nextStepExpired: string;
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
  transferExpiredEvent: string;
  transferCanceledEvent: string;
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
  transfersHistoryLabel: string;
  transfersHistoryTitle: string;
  transfersHistorySubtitle: string;
  transfersHistoryStatusLabel: string;
  transfersHistoryAllLabel: string;
  transfersHistorySearchLabel: string;
  transfersHistorySearchPlaceholder: string;
  transfersHistoryLoadingLabel: string;
  transfersHistoryEmptyLabel: string;
  transfersHistoryUnauthorizedLabel: string;
  transfersHistoryLoginLabel: string;
  transfersHistoryErrorLabel: string;
  transfersHistoryReferenceLabel: string;
  transfersHistoryRailLabel: string;
  transfersHistoryRecipientLabel: string;
  transfersHistoryDateLabel: string;
  adminWebhooksTitle: string;
  adminWebhooksSubtitle: string;
  adminWebhooksLoadingLabel: string;
  adminWebhooksEmptyLabel: string;
  adminWebhooksProviderLabel: string;
  adminWebhooksOutcomeLabel: string;
  adminWebhooksAllLabel: string;
  adminWebhooksReceivedLabel: string;
  adminWebhooksEventIdLabel: string;
  adminWebhooksTransferLabel: string;
  adminWebhooksReplayLabel: string;
  adminWebhooksReplaySuccess: string;
  adminWebhooksReplayError: string;
  adminWebhookEventsTitle: string;
  adminWebhookEventsSubtitle: string;
  adminWebhookEventsLoadingLabel: string;
  adminWebhookEventsEmptyLabel: string;
  adminWebhookEventsProviderLabel: string;
  adminWebhookEventsKindLabel: string;
  adminWebhookEventsOutcomeLabel: string;
  adminWebhookEventsAllLabel: string;
  adminWebhookEventsReceivedLabel: string;
  adminWebhookEventsEventIdLabel: string;
  adminWebhookEventsTransferLabel: string;
  adminWebhookEventsSinceLabel: string;
  adminWebhookEventsReplayLabel: string;
  adminWebhookEventsReplaySuccess: string;
  adminWebhookEventsReplayError: string;
  adminWebhookEventsDedupedLabel: string;
  adminPayoutWebhookTitle: string;
  adminPayoutWebhookSubtitle: string;
  adminPayoutWebhookLoadingLabel: string;
  adminPayoutWebhookEmptyLabel: string;
  adminPayoutWebhookStatusLabel: string;
  adminPayoutWebhookProviderLabel: string;
  adminPayoutWebhookAllLabel: string;
  adminPayoutWebhookReceivedLabel: string;
  adminPayoutWebhookEventIdLabel: string;
  adminPayoutWebhookTransferLabel: string;
  adminPayoutWebhookReasonLabel: string;
  adminPayoutWebhookFilterLabel: string;
  adminWebhookEventsDetailTitle: string;
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
  pricingTransparencyTitle: string;
  pricingTransparencySourceLabel: string;
  pricingTransparencyUpdatedLabel: string;
  pricingTransparencyAppliedRateFormula: string;
  pricingTransparencyPayVsGetNote: string;
  pricingTransparencyAdvancedTitle: string;
  pricingTransparencyEnableManualLabel: string;
  pricingTransparencyManualRateLabel: (toAsset: string, fromAsset: string) => string;
  pricingTransparencyManualRateWarning: string;
  pricingTransparencyResetLiveRate: string;
  pricingTransparencyManualRateInvalid: string;
  pricingTransparencyOverrideHelper: string;
  pricingTransparencyRateMethodologyTitle: string;
  pricingTransparencyRateMethodologyBody: string;
  pricingTransparencyFeesExplainedTitle: string;
  pricingTransparencyFeesExplainedBody: string;
  quoteIntegrityVerifiedLabel: string;
  quoteIntegrityLocksUntilLabel: (expiresAt: string) => string;
  quoteIntegrityExpiredLabel: string;
};

const EN_MESSAGES: Messages = {
  quoteTitle: (from, to) => `${from} to ${to} Quote`,
  tagline: "Clarity in every transfer.",
  navAboutLabel: "About",
  navFeesLabel: "Fees",
  navSecurityLabel: "Security",
  navHelpLabel: "Help",
  navGetStartedLabel: "Get started",
  navDashboardLabel: "Dashboard",
  navSignInLabel: "Sign in",
  navSignOutLabel: "Sign out",
  loginTitle: "Sign in to ClariSend",
  loginSubtitle:
    "We will email you a secure sign-in link. No passwords needed.",
  loginEmailLabel: "Email address",
  loginEmailPlaceholder: "you@company.com",
  loginButton: "Send magic link",
  loginSentTitle: "Check your inbox",
  loginSentDescription:
    "We sent a secure sign-in link. It expires in 24 hours.",
  loginError: "We couldn't send the link. Please check the address and try again.",
  dashboardTitle: "Your transfers",
  dashboardSubtitle: "Track transfers and access receipts in one place.",
  dashboardEmptyTitle: "No transfers yet",
  dashboardEmptyDescription:
    "Start a quote to see transfers appear here.",
  recipientsTitle: "Recipients",
  recipientsSubtitle: "Save recipients once and reuse them for future transfers.",
  recipientsEmptyTitle: "No saved recipients yet",
  recipientsEmptyDescription:
    "Create a recipient to keep details ready for the next transfer.",
  recipientsCreateTitle: "Add a recipient",
  recipientsSaveButton: "Save recipient",
  recipientRemoveButton: "Remove",
  recipientSelectLabel: "Saved recipients",
  recipientSelectPlaceholder: "Select a recipient",
  recipientSelectHelper: "Prefill details from a saved recipient.",
  recipientAuthHelper: "Sign in to save recipients and reuse details faster.",
  recipientSaveToggleLabel: "Save this recipient for next time",
  recipientSaveSuccess: "Recipient saved.",
  recipientSaveError: "We couldn't save the recipient just now. Please try again.",
  recipientLoadError: "We couldn't load recipients right now. Please refresh.",
  recipientLightningInvoiceLabel: "Lightning invoice (optional)",
  receiptResendButton: "Resend receipt",
  receiptResendLoading: "Sending receipt...",
  receiptResendSuccess: "Receipt sent. Check your inbox.",
  receiptResendError: "We couldn't resend the receipt. Please try again.",
  receiptResendRateLimited:
    "Please wait a moment before sending another receipt.",
  receiptGetButtonLabel: "Get receipt",
  receiptGetPromptLabel: "Issue the receipt to view or share it.",
  receiptAvailableAfterCompletionLabel: "Receipt available after completion.",
  receiptSnapshotUnavailableLabel: "Snapshot unavailable.",
  receiptUnauthorizedLabel: "Unauthorized",
  receiptReadyLabel: "Receipt ready to view.",
  payoutRefLabel: "Ref:",
  payoutReasonLabel: "Reason:",
  reconciliationTitle: "Reconciliation",
  reconciliationTransferIdLabel: "Transfer ID",
  reconciliationStatusLabel: "Status",
  reconciliationProviderLabel: "Provider",
  reconciliationProviderPayoutIdLabel: "Provider payout ID",
  reconciliationProviderStatusLabel: "Provider payout status",
  reconciliationUpdatedAtLabel: "Updated at",
  reconciliationUnavailableLabel: "Not available",
  reconcilePayoutTitleLabel: "Admin reconciliation",
  reconcilePayoutButtonLabel: "Reconcile payout",
  reconcilePayoutLoadingLabel: "Reconciling...",
  reconcilePayoutSuccessLabel: "Reconciliation complete.",
  reconcilePayoutErrorLabel: "Unable to reconcile payout.",
  reconcilePayoutNotProcessingLabel: "Reconciliation only available for processing or failed payouts.",
  reconcilePayoutMissingProviderLabel: "Missing provider payout id.",
  reconcilePayoutProviderStatusLabel: "Provider status:",
  payoutDiagnosticsTitle: "Payout diagnostics",
  payoutDiagnosticsEmptyLabel: "No payout attempts yet.",
  payoutDiagnosticsAttemptLabel: "Attempt",
  payoutDiagnosticsProviderLabel: "Provider",
  payoutDiagnosticsStatusLabel: "Status",
  payoutDiagnosticsRefLabel: "Provider Ref",
  payoutDiagnosticsStartedLabel: "Started",
  payoutDiagnosticsFinishedLabel: "Finished",
  payoutDiagnosticsErrorLabel: "Error",
  providerLabel: "Provider",
  providerStatusLabel: "Provider status",
  providerPayoutIdLabel: "Provider payout id",
  providerUpdatedAtLabel: "Updated",
  adminTitle: "Admin console",
  adminSubtitle: "Restricted access for ClariSend administrators.",
  adminUnauthorizedTitle: "Access restricted",
  adminUnauthorizedDescription:
    "You do not have permission to view this page.",
  adminPayoutsTitle: "Payout monitoring",
  adminPayoutsSubtitle: "Inspect provider-backed payout activity and receipts.",
  adminPayoutsEmpty: "No payout activity yet.",
  adminPayoutsLoadingLabel: "Loading payouts...",
  adminPayoutsAllLabel: "All",
  adminPayoutsReferenceLabel: "Reference",
  adminPayoutsStatusLabel: "Status",
  adminPayoutsProviderLabel: "Provider",
  adminPayoutsRailLabel: "Rail",
  adminPayoutsUpdatedLabel: "Updated",
  adminPayoutsLatestEventLabel: "Latest payout event",
  adminPayoutsReceiptLabel: "Receipt",
  adminPayoutsReceiptViewLabel: "View receipt",
  adminPayoutsReceiptUnavailableLabel: "Unavailable",
  adminPayoutsEventEmptyLabel: "No payout events",
  adminPayoutsRefreshLabel: "Refresh",
  adminPayoutsLoadError: "Unable to load payouts.",
  adminPayoutsFromLabel: "From",
  adminPayoutsToLabel: "To",
  adminPayoutsDownloadCsvLabel: "Download CSV",
  adminProvidersTitle: "Providers",
  adminProvidersSubtitle: "Manual overrides for payout providers.",
  adminProvidersEmpty: "No provider states found.",
  adminProvidersEnabledLabel: "Enabled",
  adminProvidersHealthyLabel: "Healthy",
  adminProvidersNoErrorLabel: "No recent errors",
  adminProvidersLoadError: "Unable to load providers.",
  adminProvidersUpdateError: "Unable to update provider.",
  heroTitle:
    "Send with clarity. Rates, fees, and delivery time upfront.",
  heroSubtitle:
    "Transparent pricing and dependable rails keep every transfer predictable for you and your recipient.",
  sendCardTitle: "Send money",
  sendCardSubtitle: "Start a quote in seconds with clear fees and live rates.",
  sendFromLabel: "Sending from",
  sendToLabel: "Sending to",
  sendCtaLabel: "Get started",
  primaryCorridorNote: "Primary corridor: USD → GHS",
  secondaryCorridorNote:
    "Secondary corridor selected. Availability may vary by rail.",
  trustTitle: "Clarity at every step",
  trustItemTransparent: "Transparent pricing",
  trustItemFast: "Predictable delivery",
  trustItemSecure: "Security-first controls",
  trustEncryptionLabel: "End-to-end encryption",
  trustSecureConnectionLabel: "Secure connection",
  trustRegulatoryIntentLabel: "Compliance-ready processes",
  flowStepsTitle: "Transfer steps",
  flowStepQuote: "Quote",
  flowStepReview: "Review",
  flowStepTransfer: "Transfer",
  flowStepReceipt: "Receipt",
  featuresTitle: "Built for dependable transfers",
  featuresSubtitle:
    "Clear pricing, real-time updates, and rails that keep transfers on track.",
  featuresLinkLabel: "Features",
  featureSmartRoutingTitle: "Smart routing",
  featureSmartRoutingDescription:
    "Compare routes based on total cost, speed, and payout reliability.",
  featureMultiRailTitle: "Multi-rail payout",
  featureMultiRailDescription:
    "Deliver to bank, mobile money, or lightning rails with a consistent experience.",
  featureTrackingTitle: "Tracking",
  featureTrackingDescription:
    "Live status updates and receipts keep senders and recipients aligned.",
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
    "We apply strict controls and keep transfer data encrypted end to end.",
  countrySelectChangeLabel: "Change",
  countrySelectDialogTitle: "Choose a country and currency",
  countrySelectDialogSubtitle: "Search by country, currency, or code.",
  countrySelectCloseLabel: "Close",
  countrySelectSearchPlaceholder: "Search country or currency",
  countrySelectSearchLabel: "Search country",
  countrySelectNoResultsLabel: "No matches found. Try another search.",
  countrySelectFallbackLabel: "Select country",
  footerTagline:
    "Transparent global payments built for teams that demand clarity.",
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
  quoteExpiredNotice:
    "This quote has expired. Refresh to lock a new rate before continuing.",
  quoteFetching: "Fetching quote...",
  refreshingQuote: "Refreshing quote...",
  waitingForQuote: "Waiting for quote response.",
  basedOnAfterFees: (amount) => `Based on ${amount} after fees.`,
  smartSuggestionsLabel: "Smart Suggestions",
  cheapestLabel: "Lowest Fee",
  fastestLabel: "Fastest ETA",
  bestValueLabel: "Best Value",
  routeHighlightLowestFee: "Lowest total fee",
  routeHighlightFastestEta: "Fastest ETA",
  routeHighlightHighestPayout: "Highest recipient payout",
  routeActiveLabel: "Active route",
  etaRangeLabel: (minMinutes, maxMinutes) => `${minMinutes}-${maxMinutes} min ETA`,
  useRouteButton: "Use this route",
  recommendationLoading: "Calculating available routes...",
  recommendationEmpty:
    "Enter an amount to see route suggestions.",
  recommendationLoadError:
    "We could not load suggestions. Please refresh or try again shortly.",
  recommendationWhyLabel: "Why this route",
  quoteBreakdownLabel: "Quote Breakdown",
  quoteIdLabel: "Quote ID",
  expiresAtLabel: "Expires at",
  rateSourceLabel: "Rate source",
  rateUpdatedLabel: "Rate updated",
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
  referenceCodeLabel: "Reference code",
  createdAtLabel: "Created",
  updatedAtLabel: "Last updated",
  copyReferenceButton: "Copy code",
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
    receiptLoadError: "We couldn't load the receipt. Please try again.",
    receiptNotFoundLabel: "We couldn't find that transfer.",
    receiptExpiredLabel: "This transfer expired before completion.",
    receiptBackHomeButton: "Back to home",
    executePayoutButtonLabel: "Execute payout",
    executePayoutRetryLabel: "Retry payout",
    executePayoutLoadingLabel: "Executing payout...",
    executePayoutErrorLabel: "We couldn't execute the payout. Please try again.",
    executePayoutCooldownLabel: (seconds: number) =>
      seconds > 0
        ? `Retry available in ${seconds}s.`
        : "Retry available soon.",
    executePayoutExhaustedLabel: "Payout attempts exhausted.",
    executePayoutProcessingLabel: "Payout processing...",
    executePayoutFailedLabel: "Payout failed.",
    retryPayoutLoadingLabel: "Retrying payout...",
    retryPayoutErrorLabel: "We couldn't retry the payout. Please try again.",
    cancelPayoutButtonLabel: "Cancel payout",
    cancelPayoutLoadingLabel: "Canceling payout...",
    cancelPayoutErrorLabel: "We couldn't cancel the payout. Please try again.",
  lifecycleTitle: "Transfer lifecycle",
  lifecycleCreatedLabel: "CREATED",
  lifecycleQuotedLabel: "QUOTED",
  lifecycleInitiatedLabel: "INITIATED",
  lifecyclePendingLabel: "PENDING",
  lifecycleCompletedLabel: "COMPLETED",
  lifecycleFailedLabel: "FAILED",
  lifecycleExpiredLabel: "EXPIRED",
  lifecycleCreatedDescription: "We have received your transfer request.",
  lifecycleQuotedDescription: "The quote is locked at the confirmed rate.",
  lifecycleInitiatedDescription: "Recipient details have been submitted.",
  lifecyclePendingDescription: "Payment is moving through the selected rail.",
  lifecycleCompletedDescription: "Transfer completed and receipt available.",
  lifecycleFailedDescription: "Transfer failed before delivery.",
  lifecycleExpiredDescription: "The quote expired before delivery.",
  nextStepTitle: "Next step",
  nextStepReady: "We are preparing payout on the selected rail.",
  nextStepProcessing: "Payment is processing. We'll notify you on completion.",
  nextStepCompleted: "Transfer completed. Your receipt is ready.",
  nextStepFailed: "Transfer failed. Contact support.",
  nextStepExpired: "Quote expired. Start a new transfer.",
  lightningInvoiceLabel: "Lightning invoice",
  lightningAmountLabel: "Invoice amount (sats)",
  lightningStatusLabel: "Lightning status",
  lightningWaitingLabel: "Awaiting payment",
  lightningPaidLabel: "Paid",
  copyInvoiceButton: "Copy invoice",
  simulatePaymentButton: "Simulate payment",
  transferCreatedEvent: "Transfer created",
  invoiceIssuedEvent: "Lightning invoice issued",
  quoteLockedEvent: (expiresAt) => `Quote locked until ${expiresAt}`,
  transferProcessingEvent: "Transfer is processing",
  transferCompletedEvent: "Transfer completed successfully",
  transferPaidEvent: "Lightning invoice paid",
  transferFailedEvent: "Transfer failed",
  transferExpiredEvent: "Transfer expired",
  transferCanceledEvent: "Transfer canceled",
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
    transfersHistoryLabel: "Transfers",
    transfersHistoryTitle: "Transfer history",
    transfersHistorySubtitle: "Browse recent transfers and open the full record.",
    transfersHistoryStatusLabel: "Status",
    transfersHistoryAllLabel: "All",
    transfersHistorySearchLabel: "Search",
    transfersHistorySearchPlaceholder: "Reference or recipient",
    transfersHistoryLoadingLabel: "Loading transfers...",
    transfersHistoryEmptyLabel: "No transfers yet.",
    transfersHistoryUnauthorizedLabel: "Unauthorized. Please log in to view transfers.",
    transfersHistoryLoginLabel: "Go to login",
    transfersHistoryErrorLabel: "Unable to load transfers.",
    transfersHistoryReferenceLabel: "Reference",
    transfersHistoryRailLabel: "Rail",
    transfersHistoryRecipientLabel: "Recipient",
    transfersHistoryDateLabel: "Created",
    adminWebhooksTitle: "Webhook events",
    adminWebhooksSubtitle: "Inspect recent payout webhook deliveries.",
    adminWebhooksLoadingLabel: "Loading webhook events...",
    adminWebhooksEmptyLabel: "No webhook events yet.",
    adminWebhooksProviderLabel: "Provider",
    adminWebhooksOutcomeLabel: "Outcome",
    adminWebhooksAllLabel: "All",
    adminWebhooksReceivedLabel: "Received",
    adminWebhooksEventIdLabel: "Event ID",
    adminWebhooksTransferLabel: "Transfer",
    adminWebhooksReplayLabel: "Replay",
    adminWebhooksReplaySuccess: "Replay sent.",
    adminWebhooksReplayError: "Replay failed.",
    adminWebhookEventsTitle: "Webhook events",
    adminWebhookEventsSubtitle: "Inspect and replay webhook deliveries.",
    adminWebhookEventsLoadingLabel: "Loading webhook events...",
    adminWebhookEventsEmptyLabel: "No webhook events yet.",
    adminWebhookEventsProviderLabel: "Provider",
    adminWebhookEventsKindLabel: "Kind",
    adminWebhookEventsOutcomeLabel: "Outcome",
    adminWebhookEventsAllLabel: "All",
    adminWebhookEventsReceivedLabel: "Received",
    adminWebhookEventsEventIdLabel: "Event ID",
    adminWebhookEventsTransferLabel: "Transfer",
    adminWebhookEventsSinceLabel: "Since",
    adminWebhookEventsReplayLabel: "Replay",
    adminWebhookEventsReplaySuccess: "Replay sent.",
    adminWebhookEventsReplayError: "Replay failed.",
    adminWebhookEventsDedupedLabel: "Deduped",
    adminPayoutWebhookTitle: "Payout webhooks",
    adminPayoutWebhookSubtitle: "Review recent webhook deliveries.",
    adminPayoutWebhookLoadingLabel: "Loading webhook deliveries...",
    adminPayoutWebhookEmptyLabel: "No webhook deliveries yet.",
    adminPayoutWebhookStatusLabel: "Status",
    adminPayoutWebhookProviderLabel: "Provider",
    adminPayoutWebhookAllLabel: "All",
    adminPayoutWebhookReceivedLabel: "Received",
    adminPayoutWebhookEventIdLabel: "Event ID",
    adminPayoutWebhookTransferLabel: "Transfer",
    adminPayoutWebhookReasonLabel: "Reason",
    adminPayoutWebhookFilterLabel: "Since",
    adminWebhookEventsDetailTitle: "Webhook delivery",
  bankDetailsRequired: "Bank name and account are required.",
  mobileMoneyDetailsRequired: "Provider and number are required.",
  lockQuoteRefreshFailed: "We couldn't refresh the quote. Please try again.",
  lockQuoteExpired: "That quote expired. Refresh and try again.",
  lockQuoteUpdated: "The quote changed. Please lock it again to continue.",
  quoteLoadError: "We couldn't load the quote. Please try again.",
  transferCreateError: "We couldn't create the transfer. Please try again.",
  transferUpdateError: "We couldn't update the transfer. Please try again.",
  quoteExpiredError: "That quote expired. Refresh and lock a new one.",
  invalidQuoteError: "Please lock a valid quote before continuing.",
  pricingTransparencyTitle: "Pricing transparency",
  pricingTransparencySourceLabel: "Source",
  pricingTransparencyUpdatedLabel: "Updated",
  pricingTransparencyAppliedRateFormula: "Applied rate = market rate × (1 − margin).",
  pricingTransparencyPayVsGetNote:
    "What you pay is the send amount plus fees; recipient gets is after fees.",
  pricingTransparencyAdvancedTitle: "Advanced: manual market rate override",
  pricingTransparencyEnableManualLabel: "Enable manual override",
  pricingTransparencyManualRateLabel: (toAsset, fromAsset) =>
    `Manual market rate (${toAsset} per 1 ${fromAsset})`,
  pricingTransparencyManualRateWarning:
    "Manual rate override is for testing; real quotes use live market rate.",
  pricingTransparencyResetLiveRate: "Reset to live rate",
  pricingTransparencyManualRateInvalid: "Enter a valid market rate.",
  pricingTransparencyOverrideHelper:
    "Override the market rate used by /api/quote and /api/recommendation for preview/testing.",
  pricingTransparencyRateMethodologyTitle: "Rate methodology",
  pricingTransparencyRateMethodologyBody:
    "Market rate is fetched live from providers. Applied rate = market rate × (1 − margin). The timestamp shows when the rate was last updated. Rates can change until a quote is locked.",
  pricingTransparencyFeesExplainedTitle: "Fees explained",
  pricingTransparencyFeesExplainedBody:
    "Fixed fee covers operational costs, while the percent fee scales with the amount. Total fee = fixed fee + percent fee amount. Fees are shown before the quote is locked.",
  quoteIntegrityVerifiedLabel: "Verified quote",
  quoteIntegrityLocksUntilLabel: (expiresAt) => `Locks until ${expiresAt}`,
  quoteIntegrityExpiredLabel: "Quote expired — refresh required",
};

const FR_MESSAGES: Messages = {
  quoteTitle: (from, to) => `De ${from} à ${to}`,
  tagline: "La clarte a chaque transfert.",
  navAboutLabel: "À propos",
  navFeesLabel: "Frais",
  navSecurityLabel: "Sécurité",
  navHelpLabel: "Aide",
  navGetStartedLabel: "Commencer",
  navDashboardLabel: "Tableau de bord",
  navSignInLabel: "Connexion",
  navSignOutLabel: "Deconnexion",
  loginTitle: "Connectez-vous a ClariSend",
  loginSubtitle:
    "Recevez un lien de connexion securise par email. Sans mot de passe.",
  loginEmailLabel: "Adresse email",
  loginEmailPlaceholder: "vous@entreprise.com",
  loginButton: "Envoyer le lien",
  loginSentTitle: "Consultez votre boite mail",
  loginSentDescription:
    "Nous avons envoye un lien securise. Il expire sous 24 heures.",
  loginError: "Impossible d'envoyer le lien. Verifiez l'adresse et reessayez.",
  dashboardTitle: "Vos transferts",
  dashboardSubtitle: "Suivez chaque transfert et accedez aux recus.",
  dashboardEmptyTitle: "Aucun transfert pour le moment",
  dashboardEmptyDescription:
    "Lancez un devis pour voir vos transferts ici.",
  recipientsTitle: "Beneficiaires",
  recipientsSubtitle:
    "Enregistrez vos beneficiaires pour reutiliser leurs infos.",
  recipientsEmptyTitle: "Aucun beneficiaire enregistre",
  recipientsEmptyDescription:
    "Ajoutez un beneficiaire pour garder ses informations a portee de main.",
  recipientsCreateTitle: "Ajouter un beneficiaire",
  recipientsSaveButton: "Enregistrer le beneficiaire",
  recipientRemoveButton: "Supprimer",
  recipientSelectLabel: "Beneficiaires enregistrés",
  recipientSelectPlaceholder: "Selectionner un beneficiaire",
  recipientSelectHelper:
    "Pre-remplissez les informations depuis un beneficiaire.",
  recipientAuthHelper:
    "Connectez-vous pour enregistrer et reutiliser vos beneficiaires.",
  recipientSaveToggleLabel: "Enregistrer ce beneficiaire",
  recipientSaveSuccess: "Beneficiaire enregistre.",
  recipientSaveError: "Impossible d'enregistrer le beneficiaire. Veuillez reessayer.",
  recipientLoadError: "Impossible de charger les beneficiaires. Veuillez actualiser.",
  recipientLightningInvoiceLabel: "Facture Lightning (facultatif)",
  receiptResendButton: "Renvoyer le reçu",
  receiptResendLoading: "Envoi du reçu...",
  receiptResendSuccess: "Reçu envoyé. Verifiez votre email.",
  receiptResendError: "Impossible de renvoyer le reçu. Veuillez reessayer.",
  receiptResendRateLimited:
    "Veuillez patienter avant de renvoyer le reçu.",
  receiptGetButtonLabel: "Obtenir le reçu",
  receiptGetPromptLabel: "Emettez le reçu pour l'afficher ou le partager.",
  receiptAvailableAfterCompletionLabel: "Reçu disponible après la fin.",
  receiptSnapshotUnavailableLabel: "Instantané indisponible.",
  receiptUnauthorizedLabel: "Non autorisé",
  receiptReadyLabel: "Reçu prêt à consulter.",
  payoutRefLabel: "Ref:",
  payoutReasonLabel: "Raison :",
  reconciliationTitle: "Rapprochement",
  reconciliationTransferIdLabel: "ID du transfert",
  reconciliationStatusLabel: "Statut",
  reconciliationProviderLabel: "Fournisseur",
  reconciliationProviderPayoutIdLabel: "ID du paiement fournisseur",
  reconciliationProviderStatusLabel: "Statut du paiement fournisseur",
  reconciliationUpdatedAtLabel: "Mis a jour",
  reconciliationUnavailableLabel: "Indisponible",
  reconcilePayoutTitleLabel: "Rapprochement admin",
  reconcilePayoutButtonLabel: "Rapprocher le paiement",
  reconcilePayoutLoadingLabel: "Rapprochement...",
  reconcilePayoutSuccessLabel: "Rapprochement terminé.",
  reconcilePayoutErrorLabel: "Impossible de rapprocher le paiement.",
  reconcilePayoutNotProcessingLabel:
    "Le rapprochement est disponible uniquement pour les paiements en traitement ou échoués.",
  reconcilePayoutMissingProviderLabel: "ID de paiement fournisseur manquant.",
  reconcilePayoutProviderStatusLabel: "Statut fournisseur :",
  payoutDiagnosticsTitle: "Diagnostic des paiements",
  payoutDiagnosticsEmptyLabel: "Aucune tentative pour le moment.",
  payoutDiagnosticsAttemptLabel: "Tentative",
  payoutDiagnosticsProviderLabel: "Fournisseur",
  payoutDiagnosticsStatusLabel: "Statut",
  payoutDiagnosticsRefLabel: "Ref fournisseur",
  payoutDiagnosticsStartedLabel: "Debut",
  payoutDiagnosticsFinishedLabel: "Fin",
  payoutDiagnosticsErrorLabel: "Erreur",
  providerLabel: "Fournisseur",
  providerStatusLabel: "Statut fournisseur",
  providerPayoutIdLabel: "ID du paiement fournisseur",
  providerUpdatedAtLabel: "Mis a jour",
  adminTitle: "Console admin",
  adminSubtitle: "Acces reserve aux administrateurs ClariSend.",
  adminUnauthorizedTitle: "Acces restreint",
  adminUnauthorizedDescription:
    "Vous n'avez pas les droits pour voir cette page.",
  adminPayoutsTitle: "Suivi des paiements",
  adminPayoutsSubtitle: "Consultez les paiements fournisseurs et les reçus.",
  adminPayoutsEmpty: "Aucune activite de paiement pour le moment.",
  adminPayoutsLoadingLabel: "Chargement des paiements...",
  adminPayoutsAllLabel: "Tous",
  adminPayoutsReferenceLabel: "Reference",
  adminPayoutsStatusLabel: "Statut",
  adminPayoutsProviderLabel: "Fournisseur",
  adminPayoutsRailLabel: "Canal",
  adminPayoutsUpdatedLabel: "Mis a jour",
  adminPayoutsLatestEventLabel: "Dernier evenement",
  adminPayoutsReceiptLabel: "Recu",
  adminPayoutsReceiptViewLabel: "Voir le recu",
  adminPayoutsReceiptUnavailableLabel: "Indisponible",
  adminPayoutsEventEmptyLabel: "Aucun evenement",
  adminPayoutsRefreshLabel: "Actualiser",
  adminPayoutsLoadError: "Impossible de charger les paiements.",
  adminPayoutsFromLabel: "Du",
  adminPayoutsToLabel: "Au",
  adminPayoutsDownloadCsvLabel: "Telecharger CSV",
  adminProvidersTitle: "Fournisseurs",
  adminProvidersSubtitle: "Overrides manuels pour les fournisseurs.",
  adminProvidersEmpty: "Aucun fournisseur disponible.",
  adminProvidersEnabledLabel: "Actif",
  adminProvidersHealthyLabel: "Sain",
  adminProvidersNoErrorLabel: "Aucune erreur recente",
  adminProvidersLoadError: "Impossible de charger les fournisseurs.",
  adminProvidersUpdateError: "Impossible de mettre a jour le fournisseur.",
  heroTitle:
    "Envoyez en toute clarte. Taux, frais et delais visibles.",
  heroSubtitle:
    "Tarification transparente et rails fiables pour des transferts previsibles.",
  sendCardTitle: "Envoyer de l'argent",
  sendCardSubtitle:
    "Lancez un devis en quelques secondes avec des frais clairs et des taux en direct.",
  sendFromLabel: "Envoi depuis",
  sendToLabel: "Envoi vers",
  sendCtaLabel: "Commencer",
  primaryCorridorNote: "Corridor principal : USD → GHS",
  secondaryCorridorNote:
    "Corridor secondaire selectionne. Disponibilite variable selon le rail.",
  trustTitle: "Clarte a chaque etape",
  trustItemTransparent: "Tarification transparente",
  trustItemFast: "Livraison previsible",
  trustItemSecure: "Controles de securite",
  trustEncryptionLabel: "Chiffrement de bout en bout",
  trustSecureConnectionLabel: "Connexion securisee",
  trustRegulatoryIntentLabel: "Processus prets pour la conformite",
  flowStepsTitle: "Etapes du transfert",
  flowStepQuote: "Devis",
  flowStepReview: "Revue",
  flowStepTransfer: "Transfert",
  flowStepReceipt: "Recu",
  featuresTitle: "Concu pour des transferts fiables",
  featuresSubtitle:
    "Tarification claire, mises a jour en temps reel et rails fiables.",
  featuresLinkLabel: "Fonctionnalités",
  featureSmartRoutingTitle: "Routage intelligent",
  featureSmartRoutingDescription:
    "Comparez les routes selon le cout total, la vitesse et la fiabilite.",
  featureMultiRailTitle: "Paiement multi-rail",
  featureMultiRailDescription:
    "Livrez sur banques, mobile money ou lightning avec une expérience cohérente.",
  featureTrackingTitle: "Suivi",
  featureTrackingDescription:
    "Des statuts en direct et des recus gardent tout le monde aligne.",
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
    "Nous appliquons des controles stricts et chiffrons les donnees.",
  countrySelectChangeLabel: "Modifier",
  countrySelectDialogTitle: "Choisissez un pays et une devise",
  countrySelectDialogSubtitle: "Recherchez par pays, devise ou code.",
  countrySelectCloseLabel: "Fermer",
  countrySelectSearchPlaceholder: "Rechercher un pays ou une devise",
  countrySelectSearchLabel: "Rechercher un pays",
  countrySelectNoResultsLabel: "Aucun résultat. Essayez une autre recherche.",
  countrySelectFallbackLabel: "Choisir un pays",
  footerTagline:
    "Paiements internationaux transparents, pensés pour les equipes qui exigent la clarte.",
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
  quoteExpiredNotice:
    "Ce devis a expire. Actualisez pour verrouiller un nouveau taux.",
  quoteFetching: "Devis en cours...",
  refreshingQuote: "Actualisation du devis...",
  waitingForQuote: "En attente du devis.",
  basedOnAfterFees: (amount) => `Basé sur ${amount} après frais.`,
  smartSuggestionsLabel: "Suggestions intelligentes",
  cheapestLabel: "Frais les plus bas",
  fastestLabel: "ETA la plus rapide",
  bestValueLabel: "Meilleure valeur",
  routeHighlightLowestFee: "Frais totaux les plus bas",
  routeHighlightFastestEta: "ETA la plus rapide",
  routeHighlightHighestPayout: "Montant reçu le plus élevé",
  routeActiveLabel: "Itinéraire actif",
  etaRangeLabel: (minMinutes, maxMinutes) =>
    `${minMinutes}-${maxMinutes} min ETA`,
  useRouteButton: "Utiliser cet itinéraire",
  recommendationLoading: "Calcul des routes disponibles...",
  recommendationEmpty:
    "Saisissez un montant pour afficher les suggestions.",
  recommendationLoadError:
    "Impossible de charger les suggestions. Veuillez reessayer bientot.",
  recommendationWhyLabel: "Pourquoi cette route",
  quoteBreakdownLabel: "Détail du devis",
  quoteIdLabel: "ID du devis",
  expiresAtLabel: "Expire le",
  rateSourceLabel: "Source du taux",
  rateUpdatedLabel: "Taux mis a jour",
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
  referenceCodeLabel: "Code de référence",
  createdAtLabel: "Créé",
  updatedAtLabel: "Dernière mise à jour",
  copyReferenceButton: "Copier le code",
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
    receiptLoadError: "Impossible de charger le recu. Veuillez reessayer.",
    receiptNotFoundLabel: "Transfert introuvable.",
    receiptExpiredLabel: "Ce transfert a expiré avant la fin.",
    receiptBackHomeButton: "Retour à l'accueil",
    executePayoutButtonLabel: "Exécuter le paiement",
    executePayoutRetryLabel: "Relancer le paiement",
    executePayoutLoadingLabel: "Paiement en cours...",
    executePayoutErrorLabel: "Impossible d'exécuter le paiement.",
    executePayoutCooldownLabel: (seconds: number) =>
      seconds > 0
        ? `Nouvel essai disponible dans ${seconds}s.`
        : "Nouvel essai bientôt disponible.",
    executePayoutExhaustedLabel: "Tentatives de paiement épuisées.",
    executePayoutProcessingLabel: "Paiement en cours de traitement...",
    executePayoutFailedLabel: "Paiement échoué.",
    retryPayoutLoadingLabel: "Relance du paiement...",
    retryPayoutErrorLabel: "Impossible de relancer le paiement.",
    cancelPayoutButtonLabel: "Annuler le paiement",
    cancelPayoutLoadingLabel: "Annulation du paiement...",
    cancelPayoutErrorLabel: "Impossible d'annuler le paiement.",
  lifecycleTitle: "Cycle de transfert",
  lifecycleCreatedLabel: "CRÉÉ",
  lifecycleQuotedLabel: "DEVISÉ",
  lifecycleInitiatedLabel: "INITIÉ",
  lifecyclePendingLabel: "EN ATTENTE",
  lifecycleCompletedLabel: "TERMINÉ",
  lifecycleFailedLabel: "ÉCHOUÉ",
  lifecycleExpiredLabel: "EXPIRÉ",
  lifecycleCreatedDescription: "Nous avons reçu votre demande de transfert.",
  lifecycleQuotedDescription: "Le devis est verrouillé au taux confirmé.",
  lifecycleInitiatedDescription: "Les informations du bénéficiaire ont été envoyées.",
  lifecyclePendingDescription: "Le paiement est en cours sur le rail sélectionné.",
  lifecycleCompletedDescription: "Transfert terminé et reçu disponible.",
  lifecycleFailedDescription: "Le transfert a échoué avant la livraison.",
  lifecycleExpiredDescription: "Le devis a expiré avant la livraison.",
  nextStepTitle: "Prochaine étape",
  nextStepReady: "Nous préparons le paiement avec le rail sélectionné.",
  nextStepProcessing: "Paiement en cours. Nous vous informerons à la fin.",
  nextStepCompleted: "Transfert terminé. Votre reçu est prêt.",
  nextStepFailed: "Transfert échoué. Contactez le support.",
  nextStepExpired: "Devis expiré. Lancez un nouveau transfert.",
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
  transferExpiredEvent: "Transfert expiré",
  transferCanceledEvent: "Transfert annulé",
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
    transfersHistoryLabel: "Transferts",
    transfersHistoryTitle: "Historique des transferts",
    transfersHistorySubtitle: "Consultez les transferts récents et ouvrez le détail.",
    transfersHistoryStatusLabel: "Statut",
    transfersHistoryAllLabel: "Tous",
    transfersHistorySearchLabel: "Recherche",
    transfersHistorySearchPlaceholder: "Référence ou destinataire",
    transfersHistoryLoadingLabel: "Chargement des transferts...",
    transfersHistoryEmptyLabel: "Aucun transfert pour le moment.",
    transfersHistoryUnauthorizedLabel: "Non autorisé. Connectez-vous pour voir les transferts.",
    transfersHistoryLoginLabel: "Se connecter",
    transfersHistoryErrorLabel: "Impossible de charger les transferts.",
    transfersHistoryReferenceLabel: "Référence",
    transfersHistoryRailLabel: "Rail",
    transfersHistoryRecipientLabel: "Destinataire",
    transfersHistoryDateLabel: "Créé",
    adminWebhooksTitle: "Événements webhook",
    adminWebhooksSubtitle: "Inspectez les livraisons récentes.",
    adminWebhooksLoadingLabel: "Chargement des événements...",
    adminWebhooksEmptyLabel: "Aucun événement pour le moment.",
    adminWebhooksProviderLabel: "Fournisseur",
    adminWebhooksOutcomeLabel: "Résultat",
    adminWebhooksAllLabel: "Tous",
    adminWebhooksReceivedLabel: "Reçu",
    adminWebhooksEventIdLabel: "ID événement",
    adminWebhooksTransferLabel: "Transfert",
    adminWebhooksReplayLabel: "Rejouer",
    adminWebhooksReplaySuccess: "Rejeu envoyé.",
    adminWebhooksReplayError: "Échec du rejeu.",
    adminWebhookEventsTitle: "Événements webhook",
    adminWebhookEventsSubtitle: "Inspectez et rejouez les livraisons.",
    adminWebhookEventsLoadingLabel: "Chargement des événements...",
    adminWebhookEventsEmptyLabel: "Aucun événement pour le moment.",
    adminWebhookEventsProviderLabel: "Fournisseur",
    adminWebhookEventsKindLabel: "Type",
    adminWebhookEventsOutcomeLabel: "Résultat",
    adminWebhookEventsAllLabel: "Tous",
    adminWebhookEventsReceivedLabel: "Reçu",
    adminWebhookEventsEventIdLabel: "ID événement",
    adminWebhookEventsTransferLabel: "Transfert",
    adminWebhookEventsSinceLabel: "Depuis",
    adminWebhookEventsReplayLabel: "Rejouer",
    adminWebhookEventsReplaySuccess: "Rejeu envoyé.",
    adminWebhookEventsReplayError: "Échec du rejeu.",
    adminWebhookEventsDedupedLabel: "Dédupliqué",
    adminPayoutWebhookTitle: "Webhooks de paiement",
    adminPayoutWebhookSubtitle: "Consultez les livraisons récentes.",
    adminPayoutWebhookLoadingLabel: "Chargement des webhooks...",
    adminPayoutWebhookEmptyLabel: "Aucune livraison pour le moment.",
    adminPayoutWebhookStatusLabel: "Statut",
    adminPayoutWebhookProviderLabel: "Fournisseur",
    adminPayoutWebhookAllLabel: "Tous",
    adminPayoutWebhookReceivedLabel: "Reçu",
    adminPayoutWebhookEventIdLabel: "ID événement",
    adminPayoutWebhookTransferLabel: "Transfert",
    adminPayoutWebhookReasonLabel: "Raison",
    adminPayoutWebhookFilterLabel: "Depuis",
    adminWebhookEventsDetailTitle: "Livraison webhook",
  bankDetailsRequired: "Le nom de la banque et le compte sont requis.",
  mobileMoneyDetailsRequired: "L’opérateur et le numéro sont requis.",
  lockQuoteRefreshFailed: "Impossible d’actualiser le devis. Veuillez réessayer.",
  lockQuoteExpired: "Ce devis a expiré. Actualisez et réessayez.",
  lockQuoteUpdated: "Le devis a changé. Verrouillez-le à nouveau pour continuer.",
  quoteLoadError: "Impossible de charger le devis. Veuillez réessayer.",
  transferCreateError: "Impossible de créer le transfert. Veuillez réessayer.",
  transferUpdateError: "Impossible de mettre à jour le transfert. Veuillez réessayer.",
  quoteExpiredError: "Ce devis a expiré. Actualisez et verrouillez un nouveau devis.",
  invalidQuoteError: "Verrouillez un devis valide avant de continuer.",
  pricingTransparencyTitle: "Transparence des prix",
  pricingTransparencySourceLabel: "Source",
  pricingTransparencyUpdatedLabel: "Mis à jour",
  pricingTransparencyAppliedRateFormula:
    "Taux appliqué = taux du marché × (1 − marge).",
  pricingTransparencyPayVsGetNote:
    "Vous payez le montant envoyé plus les frais ; le bénéficiaire reçoit après frais.",
  pricingTransparencyAdvancedTitle:
    "Avancé : remplacement manuel du taux du marché",
  pricingTransparencyEnableManualLabel: "Activer le remplacement manuel",
  pricingTransparencyManualRateLabel: (toAsset, fromAsset) =>
    `Taux du marché manuel (${toAsset} pour 1 ${fromAsset})`,
  pricingTransparencyManualRateWarning:
    "Le remplacement manuel est destiné aux tests ; les devis réels utilisent le taux du marché en direct.",
  pricingTransparencyResetLiveRate: "Réinitialiser au taux en direct",
  pricingTransparencyManualRateInvalid: "Saisissez un taux du marché valide.",
  pricingTransparencyOverrideHelper:
    "Remplace le taux du marché utilisé par /api/quote et /api/recommendation pour prévisualisation/tests.",
  pricingTransparencyRateMethodologyTitle: "Méthodologie du taux",
  pricingTransparencyRateMethodologyBody:
    "Le taux du marché est récupéré en direct auprès des fournisseurs. Taux appliqué = taux du marché × (1 − marge). L’horodatage indique la dernière mise à jour. Les taux peuvent changer jusqu’au verrouillage du devis.",
  pricingTransparencyFeesExplainedTitle: "Frais expliqués",
  pricingTransparencyFeesExplainedBody:
    "Le frais fixe couvre les coûts opérationnels et le frais en pourcentage varie selon le montant. Frais totaux = frais fixe + montant du frais en pourcentage. Les frais sont affichés avant le verrouillage du devis.",
  quoteIntegrityVerifiedLabel: "Devis vérifié",
  quoteIntegrityLocksUntilLabel: (expiresAt) => `Verrouillé jusqu’au ${expiresAt}`,
  quoteIntegrityExpiredLabel: "Devis expiré — actualisation requise",
};

export function getMessages(locale: Locale) {
  return locale === "fr" ? FR_MESSAGES : EN_MESSAGES;
}
