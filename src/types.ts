export interface Portion {
  amount: number;
  measure: string;
  grams: number;
}

export interface Produce {
  ndb: string;
  group: 'fruit' | 'vegetable';
  description: string;
  common_name: string | null;
  scientific_name: string | null;
  refuse_pct: number;
  edible_pct: number;
  refuse_description: string | null;
  portions: Portion[];
}
