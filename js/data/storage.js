// js/data/storage.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://ljhgeoetyvhbafewnmgw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_85mJLqObjWFtZLFhefNm3w_b7o7sqZX";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
