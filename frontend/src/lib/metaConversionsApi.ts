import { FacebookAdsApi, EventRequest, UserData, ServerEvent, CustomData } from 'facebook-nodejs-business-sdk';

const access_token = process.env.META_CONVERSION_TOKEN || '';
const pixel_id = process.env.META_PIXEL_ID || '';

if (access_token) {
  FacebookAdsApi.init(access_token);
}

export interface MetaEventData {
  eventName: string;
  eventTime?: number;
  eventId?: string;
  eventSourceUrl: string;
  clientIpAddress: string;
  clientUserAgent: string;
  fbp?: string;
  fbc?: string;
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    externalId?: string;
  };
  customData?: {
    value?: number;
    currency?: string;
    contentName?: string;
    contentCategory?: string;
    contentIds?: string[];
    contents?: any[];
    orderId?: string;
  };
}

export const sendMetaEvent = async (data: MetaEventData) => {
  if (!access_token || !pixel_id) {
    console.warn('Meta API credentials missing. Event not sent.');
    return null;
  }

  try {
    const userData = new UserData()
      .setClientIpAddress(data.clientIpAddress)
      .setClientUserAgent(data.clientUserAgent);

    // Datele utilizatorului pentru potrivire (Advanced Matching)
    if (data.fbp) userData.setFbp(data.fbp);
    if (data.fbc) userData.setFbc(data.fbc);
    if (data.userData?.email) userData.setEmail(data.userData.email);
    if (data.userData?.phone) userData.setPhone(data.userData.phone);
    if (data.userData?.firstName) userData.setFirstName(data.userData.firstName);
    if (data.userData?.lastName) userData.setLastName(data.userData.lastName);
    if (data.userData?.city) userData.setCity(data.userData.city);
    if (data.userData?.zip) userData.setZip(data.userData.zip);
    if (data.userData?.country) userData.setCountry(data.userData.country);
    if (data.userData?.externalId) userData.setExternalId(data.userData.externalId);

    const customData = new CustomData();
    if (data.customData?.value) customData.setValue(data.customData.value);
    if (data.customData?.currency) customData.setCurrency(data.customData.currency);
    if (data.customData?.contentName) customData.setContentName(data.customData.contentName);
    if (data.customData?.contentIds) customData.setContentIds(data.customData.contentIds);
    if (data.customData?.orderId) customData.setOrderId(data.customData.orderId);

    const serverEvent = new ServerEvent()
      .setEventName(data.eventName)
      .setEventTime(data.eventTime || Math.floor(Date.now() / 1000))
      .setUserData(userData)
      .setCustomData(customData)
      .setEventSourceUrl(data.eventSourceUrl)
      .setActionSource('website'); // Obligatoriu pentru evenimente de pe web
      
    if (data.eventId) serverEvent.setEventId(data.eventId); // Foarte util pentru deduplicare cu frontend-ul

    const eventsData = [serverEvent];
    const eventRequest = new EventRequest(access_token, pixel_id).setEvents(eventsData);

    const response = await eventRequest.execute();
    return response;
  } catch (error) {
    console.error('Eroare Meta Conversions API:', error);
    return null;
  }
};
