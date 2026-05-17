import linkedin from "./linkedin.js";
import indeed from "./indeed.js";
import glassdoor from "./glassdoor.js";
import naukri from "./naukri.js";
import internshala from "./internshala.js";
import wellfound from "./wellfound.js";

export const actorRegistry = {
  [linkedin.key]: linkedin,
  [indeed.key]: indeed,
  [glassdoor.key]: glassdoor,
  [naukri.key]: naukri,
  [internshala.key]: internshala,
  [wellfound.key]: wellfound,
};

export const DEFAULT_ACTOR_KEY = "linkedin";

export const getActor = (key) => {
  if (!key) return actorRegistry[DEFAULT_ACTOR_KEY];
  return actorRegistry[key] || null;
};

export const listActors = () =>
  Object.values(actorRegistry).map(({ key, label, id }) => ({
    key,
    label,
    // An empty id means the user hasn't configured this actor yet.
    configured: Boolean(id),
  }));
