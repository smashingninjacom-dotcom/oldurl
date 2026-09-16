export interface DomainTransferDetails {
  namebrightUsername: string;
  namebrightEmail: string;
  gnameOwnerId: string;
  dynadotForumId?: string;
  dynadotEmail?: string;
  savEmail?: string;
  spaceshipUsername?: string;
  spaceshipEmail?: string;
  godaddyEmail?: string;
  godaddyCustomerNumber?: string;
  preferredRegistrar?: string;
  customNotes?: string;
  updatedAt?: string;
}

const STORAGE_KEY = 'oldurl_domain_transfer_details';

export const getDefaultTransferDetails = (): DomainTransferDetails => ({
  namebrightUsername: '',
  namebrightEmail: '',
  gnameOwnerId: '',
  dynadotForumId: '',
  dynadotEmail: '',
  savEmail: '',
  spaceshipUsername: '',
  spaceshipEmail: '',
  godaddyEmail: '',
  godaddyCustomerNumber: '',
  preferredRegistrar: 'namebright',
  customNotes: '',
});

export const getDomainTransferDetails = (userIdentifier?: string): DomainTransferDetails => {
  if (typeof window === 'undefined') return getDefaultTransferDetails();
  try {
    const key = userIdentifier ? `${STORAGE_KEY}_${userIdentifier}` : STORAGE_KEY;
    const data = localStorage.getItem(key) || localStorage.getItem(STORAGE_KEY);
    if (data) {
      return { ...getDefaultTransferDetails(), ...JSON.parse(data) };
    }
  } catch (e) {
    console.warn('Error reading transfer details:', e);
  }
  return getDefaultTransferDetails();
};

export const saveDomainTransferDetails = (
  details: DomainTransferDetails,
  userIdentifier?: string
): DomainTransferDetails => {
  const payload: DomainTransferDetails = {
    ...details,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      if (userIdentifier) {
        localStorage.setItem(`${STORAGE_KEY}_${userIdentifier}`, JSON.stringify(payload));
      }
      window.dispatchEvent(
        new CustomEvent('oldurl_transfer_details_updated', {
          detail: { details: payload },
        })
      );
    } catch (e) {
      console.warn('Error saving transfer details:', e);
    }
  }

  return payload;
};
