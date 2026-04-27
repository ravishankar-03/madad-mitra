export type Urgency = 'Low' | 'Medium' | 'High' | 'Critical';
export type NeedStatus = 'Pending' | 'Confirmed' | 'Fulfilled';

export interface Need {
  id?: string;
  type: string;
  urgency: Urgency;
  location: string;
  lat?: number;
  lng?: number;
  source_text: string;
  timestamp: string;
  status: NeedStatus;
  ai_confidence: number;
  estimated_impact: string;
  resource_match: string;
}

export type ActivityType = 'survey_processed' | 'need_flagged' | 'location_validated' | 'log_exported';

export interface Activity {
  id?: string;
  type: ActivityType;
  description: string;
  details: string;
  timestamp: string;
  status: 'success' | 'warning' | 'info';
}
