// Seed failure-mode rules, sourced settlements and default peer vehicles.
// Pure TS. Regex sources are matched case-insensitively against the complaint narrative.
// Validated against live NHTSA complaints with scripts/validate-rules.ts.
import type { FailureMode, Settlement } from "./types.js";

const s = (r: RegExp): string => r.source;

const MODES_A: FailureMode[] = [
  {
    id: "death-wobble",
    name: "Death wobble (violent front-end shake)",
    componentHints: ["STEERING", "SUSPENSION"],
    include: [
      // literal "death wobble" and typos ("death wobel", "death wabble", "dead wobble")
      s(/\bdea(?:th|d)[\s-]*w[ao]+b+(?:le|el|ble|bl|ling|ly|les|led)?\b/),
      // shake/wobble + a road-input trigger (bump, pothole, expansion joint...) in either order
      s(/\b(?:shak\w*|shook|wob+l\w*|wob+el\w*|wab+l\w*|shimm\w*|oscillat\w*|vibrat\w*|shudder\w*)\b[^.!?]{0,160}\b(?:hit(?:s|ting)?|over|went\s+over|going\s+over|after)\s+(?:\w+\s+){0,3}?(?:bumps?|potholes?|uneven|expansion\s+joints?|cracks?\s+in\s+the\s+road|road\s+imperfections?|rough\s+(?:road|pavement|spot)|(?:railroad|train)\s+tracks|seams?|dips?)\b/),
      s(/\b(?:hit(?:s|ting)?|over|went\s+over|going\s+over|after)\s+(?:\w+\s+){0,3}?(?:bumps?|potholes?|uneven|expansion\s+joints?|cracks?\s+in\s+the\s+road|road\s+imperfections?|rough\s+(?:road|pavement|spot)|(?:railroad|train)\s+tracks|seams?|dips?)\b[^.!?]{0,160}\b(?:shak\w*|shook|wob+l\w*|wob+el\w*|wab+l\w*|shimm\w*|oscillat\w*|vibrat\w*|shudder\w*)/),
      // shake/wobble described as violent or uncontrollable
      s(/\b(?:violent\w*|uncontroll?ab\w*|severe(?:ly)?|out\s+of\s+control|terrifying|excessive(?:ly)?)\s+(?:\w+\s+){0,3}?(?:shak\w*|wob+l\w*|wob+el\w*|wab+l\w*|shimm\w*|oscillat\w*)/),
      s(/\b(?:shak\w*|shook|wob+l\w*|wob+el\w*|wab+l\w*|shimm\w*|oscillat\w*|vibrat\w*)\s+(?:\w+\s+){0,3}?(?:violent\w*|uncontroll?ab\w*|severe(?:ly)?|out\s+of\s+control|excessive(?:ly)?|so\s+(?:bad(?:ly)?|hard))/),
      // wobble near a speed / front-end context
      s(/\b(?:wob+l\w*|wob+el\w*|wab+l\w*)\b[^.!?]{0,120}\b(?:highway|interstate|freeway|mph|speeds?|front[\s-]?end|steering|damper|dampener)\b/),
      s(/\b(?:highway|interstate|freeway|mph|speeds?|front[\s-]?end|steering|damper|dampener)\b[^.!?]{0,120}\b(?:wob+l\w*|wob+el\w*|wab+l\w*)/),
      // steering damper/stabilizer mentioned with shaking
      s(/\bsteering\s+(?:wheel\s+)?(?:damper|dampener|stabili[sz]er)s?\b[\s\S]{0,250}\b(?:shak\w*|shook|wob+\w*|shimm\w*|oscillat\w*|vibrat\w*|shudder\w*)/),
      s(/\b(?:shak\w*|shook|wob+\w*|shimm\w*|oscillat\w*|vibrat\w*|shudder\w*)\b[\s\S]{0,250}\bsteering\s+(?:wheel\s+)?(?:damper|dampener|stabili[sz]er)/),
    ],
    exclude: [
      s(/\bwarped\s+(?:brake\s+)?rotors?\b/),
      s(/\b(?:only|just)\s+when\s+(?:i\s+)?(?:apply|applying|press|pressing)\s+the\s+brakes?\b/),
      s(/\b(?:at|while|when)\s+(?:\w+\s+){0,2}?idl(?:e|ing)\b[^.!?]{0,60}\b(?:shak|vibrat)/),
      s(/\b(?:sitting|stopped|idling|waiting)\s+at\s+a\s+(?:red\s+light|stop\s*(?:light|sign))\b[^.!?]{0,60}\b(?:shak|vibrat)/),
    ],
    coverageTerms: [
      s(/\bsteering\s+damper/),
      s(/\btrack\s+bar/),
      s(/\bdeath\s+wobble/),
      s(/\bfront\s+suspension.{0,80}(?:oscillat|shimmy|wobble|vibrat)/),
      s(/\bsteering\s+wheel.{0,60}(?:shake|shimmy|oscillat|wobble)/),
      s(/\b(?:shimmy|oscillation|wobble)\b/),
    ],
    hazard:
      "Sudden, violent oscillation of the front axle and steering at speed can make the vehicle difficult to control and increase the risk of a crash.",
  },
  {
    id: "phantom-braking",
    name: "Phantom braking (unexpected automatic braking, no obstacle)",
    componentHints: ["FORWARD COLLISION AVOIDANCE", "SERVICE BRAKES", "VEHICLE SPEED CONTROL"],
    include: [
      s(/\bph?antom[\s-]*brak\w*/),
      s(/\bghost[\s-]*brak\w*/),
      s(/\bfalse\s+(?:\w+\s+){0,2}?(?:brak\w*|(?:collision\s+)?(?:alerts?|warnings?)\s+(?:\w+\s+){0,6}?brak\w*|aeb|positives?\s+(?:\w+\s+){0,4}?brak\w*)/),
      s(/\b(?:brak\w*|decelerat\w*|slam\w*\s+(?:on\s+)?(?:the\s+)?brakes?)\s+(?:\w+\s+){0,10}?(?:for\s+no\s+(?:apparent\s+)?reason|with\s+no\s+(?:\w+\s+){0,3}?(?:obstacles?|obstructions?|vehicles?|cars?|objects?|reason|traffic)|nothing\s+(?:was\s+)?(?:in\s+front|ahead|there)|no\s+(?:obstacles?|obstructions?|cars?|vehicles?|objects?)\s+(?:\w+\s+){0,2}?(?:in\s+front|ahead|present|nearby))/),
      s(/\b(?:automatic\s+emergency\s+brak\w*|aeb|emergency\s+brak\w*|collision\s+(?:avoidance|mitigation)\s+(?:\w+\s+){0,2}?)\s*(?:\w+\s+){0,6}?(?:activated|engaged|applied|deployed|triggered|kicked\s+in)\s+(?:\w+\s+){0,8}?(?:no\s+reason|nothing|no\s+(?:obstacle|vehicle|car|object)|unexpectedly|without\s+(?:warning|cause|reason))/),
      s(/\b(?:suddenly|unexpectedly|abruptly|randomly)\s+(?:\w+\s+){0,2}?(?:brak(?:ed|es|ing)|slam(?:med|s)\s+(?:on\s+)?(?:the\s+)?brakes?|decelerat\w*)\s+(?:\w+\s+){0,12}?(?:no\s+(?:\w+\s+){0,2}?(?:reason|obstacle|vehicle|car|object|traffic)|nothing\s+(?:in\s+front|ahead|there)|shadows?|overpass|bridge)/),
      // unexpected braking/deceleration while a driver-assist or cruise system is engaged
      s(/\b(?:sudden(?:ly)?|unexpected(?:ly)?|random(?:ly)?|unexplained|unprovoked|unnecessar(?:y|ily)|abrupt(?:ly)?|unwarranted|erratic(?:ally)?)\s+(?:\w+\s+){0,4}?(?:brak\w*|break(?:s|ing)?|slam(?:s|med)?\s+on\s+(?:the\s+)?br[ae]a?ks?|decelerat\w*|slow(?:s|ed)?\s+down|emergency\s+brak\w*)\b[\s\S]{0,300}?\b(?:cruise|auto[\s-]?pilot|fsd|self[\s-]?driving|tacc|adaptive|aeb|collision\s+(?:avoidance|warning)|driver\s+assist\w*|rear[\s-]?ended|behind\s+(?:me|us)|following\s+(?:me|us|close)|no\s+(?:\w+\s+){0,2}?(?:reason|obstacle|vehicle|car|object|one)|nothing\s+(?:in\s+front|ahead|there|around|in\s+the\s+road))/),
      s(/\b(?:cruise|auto[\s-]?pilot|fsd|self[\s-]?driving|tacc|adaptive|driver\s+assist\w*)\b[\s\S]{0,200}?\b(?:sudden(?:ly)?|unexpected(?:ly)?|random(?:ly)?|unexplained|unprovoked|unnecessar(?:y|ily)|abrupt(?:ly)?|without\s+warning)\s+(?:\w+\s+){0,4}?(?:brak\w*|break(?:s|ing)?|slam(?:s|med)?\s+on\s+(?:the\s+)?br[ae]a?ks?|decelerat\w*|slow(?:s|ed)?\s+down|emergency\s+brak\w*)/),
    ],
    exclude: [
      s(/\bbrakes?\s+(?:\w+\s+){0,3}?(?:failed|did\s+not\s+(?:work|engage|stop))\b/),
    ],
    coverageTerms: [
      s(/\bautomatic\s+emergency\s+brak/),
      s(/\b(?:aeb|fcw)\b/),
      s(/\bforward\s+collision/),
      s(/\b(?:unexpected|unintended|false|inadvertent)\s+(?:\w+\s+){0,3}?brak/),
      s(/\bphantom\s+brak/),
      s(/\bcollision\s+(?:avoidance|mitigation)/),
    ],
    hazard:
      "Unexpected hard braking with no obstacle present can cause following vehicles to strike the vehicle from behind.",
  },
  {
    id: "engine-seizure",
    name: "Engine seizure / connecting-rod bearing failure",
    componentHints: ["ENGINE", "ENGINE AND ENGINE COOLING"],
    include: [
      s(/\bengine\s+(?:\w+\s+){0,3}?(?:seiz\w*|sie?z\w*|locked\s+up|lock\s+up|locking\s+up|blew\s+up|blown|exploded|threw\s+a\s+rod|grenaded)/),
      s(/\b(?:seized|seizing|seizure)\s+(?:\w+\s+){0,2}?engine/),
      s(/\b(?:rod|connecting[\s-]rod|bearing|crankshaft)\s+(?:\w+\s+){0,3}?(?:knock\w*|fail\w*|spun|broke\w*|damage\w*|wear)/),
      s(/\b(?:knock\w*|spun)\s+(?:\w+\s+){0,3}?(?:rod|connecting[\s-]rod|rod\s+bearings?|bearings?)\b/),
      s(/\bthr(?:ew|ow|own)\s+a\s+rod\b/),
      s(/\bhole\s+in\s+(?:the\s+)?(?:engine\s+)?block\b/),
      // "complete/sudden engine failure", "diagnosed with engine failure" — but not "could lead to engine failure"
      s(/(?<!\b(?:could|may|might|potential(?:ly)?|risk\s+of|lead\s+to|cause|result\s+in|afraid|fear|prevent)\s+(?:\w+\s+){0,3})\b(?:catastrophic|complete|total|sudden|diagnosed\s+(?:\w+\s+){0,2}?with)\s+engine\s+failure/),
      s(/\bengine\s+(?:\w+\s+){0,2}?(?:needs?|needed|required|requires)\s+(?:to\s+be\s+)?(?:a\s+)?(?:replac\w*|rebuil\w*)/),
      s(/\b(?:new|replacement|replaced\s+the)\s+(?:short[\s-]block|long[\s-]block|engine\s+block)\b/),
      // standalone "seized" with an engine/driving context nearby
      s(/\b(?:seized|seizing)\b(?:\s+up)?\s+(?:on|while|at|in|going|driving)\b/),
      // knocking + loss of power / stall / tow
      s(/\bknock\w*\b[\s\S]{0,250}?\b(?:died|stall\w*|lost\s+(?:all\s+)?(?:engine\s+)?power|loss\s+of\s+(?:engine\s+|motive\s+)?power|shut\s+(?:off|down)|tow(?:ed)?|limp\s+mode)\b/),
      s(/\b(?:died|stall\w*|lost\s+(?:all\s+)?(?:engine\s+)?power|loss\s+of\s+(?:engine\s+|motive\s+)?power|shut\s+(?:off|down))\b[\s\S]{0,150}?\b(?:engine\s+(?:\w+\s+){0,2}?knock\w*|knock\w*\s+(?:\w+\s+){0,3}?(?:noise|sound)\s+(?:\w+\s+){0,3}?engine)/),
    ],
    exclude: [],
    coverageTerms: [
      s(/\bconnecting\s+rod/),
      s(/\b(?:rod\s+)?bearings?\b.{0,80}(?:wear|damage|fail|seiz)/),
      s(/\bengine\s+(?:seizure|seize|failure|stall)/),
      s(/\bcrankshaft/),
      s(/\bknock\s+sensor/),
      s(/\bmachining\s+(?:error|debris)/),
    ],
    hazard:
      "Engine seizure while driving causes a sudden loss of motive power and, in some cases, an engine compartment fire, increasing the risk of a crash.",
  },
  {
    id: "stall-while-driving",
    name: "Loss of motive power / stall while driving",
    componentHints: ["ENGINE", "POWER TRAIN", "FUEL SYSTEM", "ELECTRICAL SYSTEM"],
    include: [
      s(/\b(?:engine|vehicle|car|truck|suv|it)\s+(?:\w+\s+){0,3}?(?:stall\w*|shut\s+(?:off|down)|died|cut\s+off|turned\s+off)\s+(?:\w+\s+){0,8}?(?:while\s+(?:driving|traveling|travelling|accelerating|merging|turning|in\s+motion|on\s+the\s+(?:highway|freeway|interstate|road))|at\s+(?:\d+|highway|freeway)\s*(?:mph|speeds?)?|in\s+(?:traffic|an?\s+intersection)|on\s+the\s+(?:highway|freeway|interstate))/),
      s(/\b(?:loss|lost|loses|losing)\s+(?:of\s+)?(?:all\s+)?(?:motive\s+|engine\s+|drive\s+)?(?:power|propulsion|acceleration)(?!\s+(?:steering|brak\w*|assist|windows?|seats?|liftgate|locks?|mirrors?))\s+(?:\w+\s+){0,8}?(?:while|driving|highway|freeway|interstate|traffic|mph|speed)/),
      s(/\b(?:while|when)\s+(?:driving|traveling|travelling|accelerating|merging)\s+(?:\w+\s+){0,8}?(?:engine|vehicle|car|it)\s+(?:\w+\s+){0,2}?(?:stall\w*|shut\s+(?:off|down)|died|lost\s+(?:all\s+)?(?:motive\s+)?power)/),
    ],
    exclude: [s(/\bstart[\s-]?stop\b|\bauto(?:matic)?\s+(?:engine\s+)?(?:start[\s-]?stop|stop[\s-]?start)\b/)],
    coverageTerms: [
      s(/\b(?:engine\s+)?stall/),
      s(/\bloss\s+of\s+(?:motive\s+|drive\s+)?power/),
      s(/\bloss\s+of\s+propulsion/),
    ],
    hazard:
      "A stall or loss of drive power at speed can leave the vehicle stopped in traffic and increases the risk of a crash.",
  },
  {
    id: "iccu-12v-power-loss",
    name: "EV charging-unit (ICCU) / 12-volt failure leading to power loss",
    componentHints: ["ELECTRICAL SYSTEM", "ELECTRICAL SYSTEM: 12V/24V/48V BATTERY", "POWER TRAIN"],
    include: [
      s(/\biccu\b/),
      s(/\bintegrated\s+charging\s+control\s+unit/),
      s(/\b12[\s-]?v(?:olt)?\s+(?:\w+\s+){0,2}?(?:battery\s+)?(?:\w+\s+){0,3}?(?:died|dead|drain\w*|discharg\w*|fail\w*|not\s+charg\w*|stopped\s+charg\w*)\s+(?:\w+\s+){0,12}?(?:while\s+driving|lost\s+(?:all\s+)?power|loss\s+of\s+(?:motive\s+)?power|shut\s+down|turtle\s+mode|stranded)/),
      s(/\b(?:turtle\s+mode|reduced\s+power\s+mode)\b[\s\S]{0,200}\b(?:12[\s-]?v|charg\w*|ldc|dc[\s-]?dc)/),
      s(/\b(?:loud\s+)?pop(?:ping)?\s+(?:noise|sound)\s+(?:\w+\s+){0,10}?(?:lost\s+(?:all\s+)?power|loss\s+of\s+(?:motive\s+)?power|power\s+loss)/),
    ],
    exclude: [],
    coverageTerms: [
      s(/\biccu\b/),
      s(/\bintegrated\s+charging\s+control\s+unit/),
      s(/\b12[\s-]?v(?:olt)?\s+(?:auxiliary\s+|low[\s-]voltage\s+)?battery.{0,80}(?:charg|discharg|loss\s+of\s+(?:motive|drive)\s+power)/),
      s(/\bldc\b|\blow[\s-]voltage\s+dc/),
    ],
    hazard:
      "Failure of the charging unit or 12-volt supply can cause an EV to lose drive power while moving, increasing the risk of a crash.",
  },
  {
    id: "unintended-acceleration",
    name: "Unintended / sudden acceleration",
    componentHints: ["VEHICLE SPEED CONTROL", "ENGINE", "ACCELERATOR PEDAL"],
    include: [
      s(/\b(?:unintended|unintentional|sudden|uncommanded|unexpected|unwanted)\s+(?:\w+\s+){0,1}?acceleration/),
      s(/\b(?:accelerated|surged|lunged|took\s+off|shot\s+forward|raced|revved)\s+(?:\w+\s+){0,6}?(?:on\s+its\s+own|by\s+itself|without\s+(?:\w+\s+){0,3}?(?:pressing|touching|my\s+foot|input|depressing|stepping)|with\s+(?:my\s+)?foot\s+on\s+the\s+brake)/),
      s(/\b(?:suddenly|unexpectedly)\s+(?:\w+\s+){0,2}?(?:accelerated|surged|lunged|took\s+off|shot\s+forward)/),
      s(/\bthrottle\s+(?:\w+\s+){0,2}?(?:stuck|stick\w*)\s+open\b|\b(?:gas|accelerator)\s+pedal\s+(?:\w+\s+){0,2}?(?:stuck|stick\w*)\b/),
    ],
    exclude: [],
    coverageTerms: [
      s(/\b(?:unintended|sudden|unexpected)\s+acceleration/),
      s(/\baccelerator\s+pedal.{0,60}(?:stick|stuck|entrap|return)/),
      s(/\bthrottle.{0,40}(?:stick|stuck|open)/),
    ],
    hazard:
      "Acceleration the driver did not command can cause a collision with vehicles, pedestrians or objects.",
  },
  {
    id: "brake-loss",
    name: "Brake loss / pedal to the floor",
    componentHints: ["SERVICE BRAKES", "SERVICE BRAKES, HYDRAULIC"],
    include: [
      s(/\bbrake\s+pedal\s+(?:\w+\s+){0,4}?(?:went|goes|sank|sinks|go|dropped|drops|sunk)\s+(?:all\s+the\s+way\s+)?(?:to\s+the\s+)?floor/),
      s(/\b(?:lost|loss\s+of|no)\s+(?:all\s+)?(?:braking|brakes?|brake\s+pressure|stopping\s+power)\b(?!\s+(?:light|warning|lamp|pads?|noise))/),
      s(/\bbrakes?\s+(?:\w+\s+){0,2}?(?:completely\s+|totally\s+)?(?:failed|gave\s+out|went\s+out|stopped\s+working|did\s+not\s+(?:work|respond|engage)|were\s+not\s+(?:working|responsive)|became\s+(?:ineffective|unresponsive))/),
      s(/\b(?:unable|could\s+not|couldn'?t|was\s+not\s+able)\s+to\s+(?:stop|slow\s+down)\s+(?:the\s+)?(?:vehicle|car|truck)?/),
    ],
    exclude: [s(/\bparking\s+brake\s+(?:\w+\s+){0,2}?(?:failed|did\s+not)/)],
    coverageTerms: [
      s(/\b(?:loss|reduction|reduced)\s+(?:of\s+)?(?:brake|braking)\s+(?:\w+\s+){0,2}?(?:assist|power|performance|pressure|fluid)/),
      s(/\bbrake\s+(?:fluid\s+)?(?:leak|line|hose|booster|master\s+cylinder|caliper)/),
      s(/\bincreased\s+stopping\s+distance/),
    ],
    hazard:
      "A loss of braking prevents the driver from slowing or stopping the vehicle and increases the risk of a crash.",
  },
  {
    id: "power-steering-loss",
    name: "Loss of power-steering assist",
    componentHints: ["STEERING"],
    include: [
      s(/\b(?:lost|loss\s+of|loses|losing|no)\s+(?:all\s+)?(?:electric\s+)?(?:power\s+)?steering(?:\s+(?:assist\w*|control|ability|power))?\b/),
      s(/\bpower\s+steering\s+(?:\w+\s+){0,3}?(?:failed|failure|went\s+out|stopped\s+working|cut\s+out|malfunction\w*)/),
      s(/\bsteering\s+(?:wheel\s+)?(?:\w+\s+){0,2}?(?:locked\s+up|became\s+(?:very\s+)?(?:stiff|heavy|hard|difficult)|was\s+(?:very\s+)?(?:stiff|heavy|hard\s+to\s+turn|difficult\s+to\s+turn))/),
      s(/\bservice\s+power\s+steering\b|\bepas\b|\beps\s+(?:warning|light|fault|failure)/),
    ],
    exclude: [],
    coverageTerms: [
      s(/\b(?:loss|lose)\s+(?:of\s+)?(?:power\s+)?steering\s+assist/),
      s(/\bpower\s+steering/),
      s(/\belectric\s+power\s+steering|\beps\b/),
      s(/\bincreased\s+steering\s+effort/),
    ],
    hazard:
      "A sudden loss of steering assist requires much greater effort to steer, which can lead to a crash, especially at low speed or in turns.",
  },
  {
    id: "airbag-non-deployment",
    name: "Airbag did not deploy in a crash",
    componentHints: ["AIR BAGS"],
    include: [
      s(/\b(?:air\s?bags?|airbags?|curtain\s+bags?)\s+(?:\w+\s+){0,4}?(?:did\s+not|didn'?t|failed\s+to|never|would\s+not|didnt)\s+(?:\w+\s+){0,1}?deploy/),
      s(/\bno\s+(?:air\s?bags?|airbags?)\s+(?:\w+\s+){0,2}?deployed\b/),
      s(/\b(?:none\s+of\s+the|neither\s+of\s+the)\s+(?:air\s?bags?|airbags?)\s+(?:\w+\s+){0,2}?deployed/),
    ],
    exclude: [],
    coverageTerms: [
      s(/\b(?:air\s?bags?|airbags?).{0,60}(?:not|fail\w*\s+to)\s+deploy/),
      s(/\bocs\b|\boccupant\s+classification/),
      s(/\b(?:air\s?bag|airbag)\s+control\s+(?:unit|module)/),
    ],
    hazard:
      "An airbag that fails to deploy in a crash increases the risk of injury or death to the occupant.",
  },
  {
    id: "airbag-warning-light",
    name: "Airbag / SRS warning light illuminated",
    componentHints: ["AIR BAGS"],
    include: [
      s(/\b(?:air\s?bag|airbag|srs|supplemental\s+restraint)\s+(?:\w+\s+){0,2}?(?:warning\s+)?(?:light|lamp|indicator|warning|message|fault)\s+(?:\w+\s+){0,3}?(?:came\s+on|illuminat\w*|is\s+on|was\s+on|stays?\s+on|remained\s+on|lit|appeared|flash\w*|turned\s+on)/),
      s(/\b(?:illuminat\w*|came\s+on)\s+(?:\w+\s+){0,3}?(?:air\s?bag|airbag|srs)\s+(?:warning\s+)?(?:light|lamp|indicator)/),
      s(/\bpassenger\s+(?:air\s?bag|airbag)\s+(?:off|disabled?)\s+(?:\w+\s+){0,4}?(?:adult|someone|occupied|sitting|passenger)/),
    ],
    exclude: [],
    coverageTerms: [
      s(/\b(?:air\s?bag|airbag|srs)\s+(?:warning\s+)?(?:light|lamp|indicator)/),
      s(/\bclockspring|\bclock\s+spring/),
      s(/\boccupant\s+classification/),
      s(/\bseat\s+(?:belt\s+)?(?:sensor|wiring|harness).{0,60}(?:air\s?bag|airbag)/),
    ],
    hazard:
      "An airbag fault indication can mean the airbags are disabled and may not deploy in a crash.",
  },
  {
    id: "seat-belt-failure",
    name: "Seat belt failure (latch, retractor, pretensioner)",
    componentHints: ["SEAT BELTS"],
    include: [
      s(/\b(?:seat\s?belts?|safety\s+belts?)\s+(?:\w+\s+){0,4}?(?:did\s+not|didn'?t|failed\s+to|would\s+not|will\s+not|won'?t|does\s+not|doesn'?t)\s+(?:\w+\s+){0,1}?(?:lock|latch|retract|hold|restrain|buckle|release|unlatch)/),
      s(/\b(?:seat\s?belts?|safety\s+belts?|buckles?)\s+(?:\w+\s+){0,3}?(?:came\s+(?:unbuckled|unlatched|undone|loose)|unlatched|unbuckled|broke|snapped|tore|frayed|is\s+stuck|was\s+stuck|stuck)/),
      s(/\bpretensioner\s+(?:\w+\s+){0,3}?(?:fail\w*|fired|deployed|did\s+not)/),
    ],
    exclude: [],
    coverageTerms: [
      s(/\bseat\s?belts?/),
      s(/\bpretensioner/),
      s(/\bbuckle/),
      s(/\bretractor/),
    ],
    hazard:
      "A seat belt that does not latch, lock or hold fails to restrain the occupant in a crash, increasing the risk of injury.",
  },
];

const MODES_B: FailureMode[] = [
  {
    id: "rollaway-park",
    name: "Rollaway / park not engaging",
    componentHints: ["POWER TRAIN", "PARKING BRAKE"],
    include: [
      s(/\broll(?:ed|s|ing)?[\s-]?away\b/),
      s(/\b(?:vehicle|car|truck|suv|it|jeep)\s+(?:\w+\s+){0,4}?(?:rolled|started\s+rolling|began\s+(?:to\s+)?roll\w*|moved|kept\s+rolling)\s+(?:\w+\s+){0,6}?(?:while\s+)?(?:in|into|after\s+(?:being\s+)?(?:placed|put|shifted)\s+(?:in|into))\s+park\b/),
      s(/\b(?:in|into)\s+park\s+(?:\w+\s+){0,6}?(?:rolled|started\s+rolling|began\s+(?:to\s+)?roll\w*|moved\s+(?:forward|backward|backwards))/),
      s(/\b(?:would\s+not|wouldn'?t|did\s+not|didn'?t|failed\s+to|will\s+not|won'?t)\s+(?:\w+\s+){0,1}?(?:go|shift|engage|stay)\s+(?:into|in)\s+park\b/),
    ],
    exclude: [],
    coverageTerms: [
      s(/\broll[\s-]?away/),
      s(/\bpark(?:ing)?\s+(?:pawl|position|engag)/),
      s(/\bshift(?:er)?\s+(?:\w+\s+){0,2}?(?:park|cable|bushing)/),
      s(/\bvehicle\s+(?:may\s+)?(?:roll|move)\s+(?:\w+\s+){0,3}?unexpectedly/),
    ],
    hazard: "A vehicle that is not held in park can roll away unattended and strike people or objects.",
  },
  {
    id: "transmission-shudder",
    name: "Transmission shudder / harsh or delayed shifting",
    componentHints: ["POWER TRAIN"],
    include: [
      s(/\btransmission\s+(?:\w+\s+){0,4}?(?:shudder\w*|slip\w*|jerk\w*|lurch\w*|slam\w*|clunk\w*|hesitat\w*|delay\w*|harsh\w*|hard\s+shift\w*|bang\w*)/),
      s(/\b(?:harsh|hard|delayed|rough|erratic|violent)\s+(?:down|up)?shift\w*/),
      s(/\b(?:shudder\w*|lurch\w*|jerk\w*|slipp\w*|hesitat\w*)\s+(?:\w+\s+){0,4}?(?:when|while)\s+(?:shifting|changing\s+gears|downshifting|upshifting)/),
      s(/\b(?:stuck|stays)\s+in\s+(?:\w+\s+)?gear\b|\bwould\s+not\s+(?:up|down)?shift\b|\blimp\s+mode\b/),
    ],
    exclude: [],
    coverageTerms: [
      s(/\btransmission/),
      s(/\btorque\s+converter/),
      s(/\b(?:harsh|delayed|unexpected)\s+(?:down|up)?shift/),
      s(/\bvalve\s+body|\bclutch/),
    ],
    hazard:
      "Unexpected lurching, slipping or delayed engagement can cause a loss of acceleration in traffic or an unintended movement, increasing crash risk.",
  },
  {
    id: "fuel-leak",
    name: "Fuel leak / fuel odor",
    componentHints: ["FUEL SYSTEM", "FUEL SYSTEM, GASOLINE", "FUEL SYSTEM, DIESEL"],
    include: [
      s(/\b(?:fuel|gas|gasoline|diesel)\s+(?:\w+\s+){0,2}?(?:leak\w*|odou?r|smell\w*|fumes?|dripp\w*|pouring)/),
      s(/\b(?:smell\w*|odou?r)\s+(?:of\s+)?(?:raw\s+)?(?:fuel|gas|gasoline|diesel)\b/),
      s(/\bleak\w*\s+(?:\w+\s+){0,2}?(?:fuel|gas|gasoline|diesel)\b(?!\s+(?:mileage|cap\s+light))/),
    ],
    exclude: [s(/\bexhaust\s+(?:fumes?|smell|odou?r)/)],
    coverageTerms: [s(/\bfuel\s+(?:\w+\s+){0,2}?(?:leak|odor|odour|smell)/), s(/\bfuel\s+(?:line|tank|pump|rail|injector|filler|hose)/)],
    hazard: "Fuel leaking in the presence of an ignition source increases the risk of a fire.",
  },
  {
    id: "vehicle-fire",
    name: "Vehicle fire or smoke (not crash-related)",
    componentHints: ["ELECTRICAL SYSTEM", "ENGINE", "FUEL SYSTEM"],
    include: [
      s(/\b(?:caught|catch|catching|burst|bursting)\s+(?:on\s+)?(?:in(?:to)?\s+)?(?:fire|flames?)\b/),
      s(/\b(?:engine|vehicle|car|truck|battery|dash(?:board)?|hood|compartment)\s+(?:\w+\s+){0,3}?(?:was\s+)?(?:on\s+fire|in\s+flames|engulfed|burn(?:ed|t|ing)\s+(?:up|down|out))/),
      s(/\b(?:smoke|flames?)\s+(?:\w+\s+){0,3}?(?:coming|came|pouring|billowing|rising)\s+(?:\w+\s+){0,2}?(?:from|out\s+of)\s+(?:\w+\s+){0,2}?(?:hood|engine|dash|vents?|compartment|steering|battery|under)/),
      s(/\bthermal\s+(?:runaway|event)\b/),
    ],
    exclude: [s(/\bafter\s+(?:the\s+)?(?:crash|collision|accident)[\s\S]{0,60}\b(?:fire|flames?)/)],
    coverageTerms: [s(/\bfire\b/), s(/\bthermal\s+(?:runaway|event)/), s(/\bsmoke/), s(/\boverheat/)],
    hazard: "A fire while driving or parked can injure occupants and bystanders and destroy property.",
  },
  {
    id: "oil-consumption",
    name: "Excessive engine oil consumption",
    componentHints: ["ENGINE"],
    include: [
      s(/\b(?:excessive|abnormal|high)\s+(?:engine\s+)?oil\s+(?:consumption|use|usage|burn\w*|loss)/),
      s(/\b(?:burn\w*|consum\w*|using|uses|losing|loses)\s+(?:\w+\s+){0,3}?oil\b(?!\s+(?:change|filter|pressure\s+sensor))/),
      s(/\b(?:a\s+)?(?:quart|qt)s?\s+(?:of\s+oil\s+)?(?:every|per|each)\s+[\d,]+\s*(?:miles|mi)\b/),
      s(/\boil\s+consumption\s+test\b/),
    ],
    exclude: [s(/\boil\s+leak\w*/)],
    coverageTerms: [s(/\boil\s+consumption/), s(/\bpiston\s+rings?/), s(/\blow\s+oil\s+level/)],
    hazard: "Oil consumption that leaves the engine low on oil can lead to engine damage and loss of power while driving.",
  },
  {
    id: "headlight-failure",
    name: "Headlight failure / dim or inoperative headlights",
    componentHints: ["EXTERIOR LIGHTING", "EXTERIOR LIGHTING:HEADLIGHTS"],
    include: [
      s(/\bhead[\s-]?(?:light|lamp)s?\s+(?:\w+\s+){0,3}?(?:fail\w*|went\s+out|go(?:es)?\s+out|stopped\s+working|not\s+work\w*|burn(?:ed|t)\s+out|flicker\w*|dim|cut\s+out|shut\s+off|turned\s+off|inoperative|intermittent\w*|condensation|moisture|water)/),
      s(/\b(?:lost|loss\s+of|no)\s+(?:all\s+)?head[\s-]?(?:light|lamp)s?\b/),
    ],
    exclude: [],
    coverageTerms: [s(/\bhead[\s-]?(?:light|lamp)s?/), s(/\blow[\s-]beam|\bhigh[\s-]beam/)],
    hazard: "Headlights that fail or dim at night reduce the driver's visibility and the vehicle's conspicuity, increasing crash risk.",
  },
  {
    id: "backup-camera-failure",
    name: "Rearview camera failure",
    componentHints: ["BACK OVER PREVENTION", "BACK OVER PREVENTION: REARVIEW SYSTEM"],
    include: [
      s(/\b(?:back[\s-]?up|rear[\s-]?view|reverse|rear)\s+camera\s+(?:\w+\s+){0,4}?(?:fail\w*|not\s+work\w*|stopped\s+working|black|blank|freez\w*|frozen|flicker\w*|intermittent\w*|does\s+not|did\s+not|doesn'?t|didn'?t|won'?t|would\s+not|no\s+(?:image|picture|video|display)|blue\s+screen|went\s+out|inoperative|malfunction\w*)/),
      s(/\b(?:no|blank|black)\s+(?:\w+\s+){0,2}?(?:back[\s-]?up|rear[\s-]?view|reverse|rear)\s+camera\b/),
      s(/\brear[\s-]?view\s+(?:camera\s+)?(?:image|display)\s+(?:\w+\s+){0,3}?(?:not|fail|black|blank)/),
    ],
    exclude: [],
    coverageTerms: [s(/\brear[\s-]?view\s+(?:camera|image)/), s(/\bback[\s-]?up\s+camera/), s(/\bfmvss\s+(?:no\.\s*)?111\b/)],
    hazard: "A rearview image that fails to display reduces the driver's view behind the vehicle, increasing the risk of a back-over crash.",
  },
  {
    id: "door-latch",
    name: "Door opens while driving / door latch failure",
    componentHints: ["LATCHES/LOCKS/LINKAGES", "STRUCTURE"],
    include: [
      s(/\b(?:door|tailgate|liftgate|hatch)\s+(?:\w+\s+){0,3}?(?:flew|swung|popped|came|opened)\s+(?:open\s+)?(?:\w+\s+){0,4}?(?:while\s+(?:driving|traveling|travelling|in\s+motion|moving)|on\s+the\s+(?:highway|road|freeway)|at\s+(?:\d+\s*mph|highway\s+speed))/),
      s(/\bdoor\s+(?:\w+\s+){0,3}?(?:latch|lock)\w*\s+(?:\w+\s+){0,3}?(?:fail\w*|broke\w*|not\s+latch\w*|would\s+not|did\s+not|does\s+not|won'?t)/),
      s(/\b(?:door|doors)\s+(?:would\s+not|will\s+not|won'?t|did\s+not|does\s+not)\s+(?:\w+\s+){0,1}?(?:latch|close|stay\s+closed|lock)/),
    ],
    exclude: [],
    coverageTerms: [s(/\b(?:door|tailgate|liftgate|hood)\s+(?:\w+\s+){0,2}?latch/), s(/\bdoor\s+(?:may\s+)?open/), s(/\bfmvss\s+(?:no\.\s*)?206\b/)],
    hazard: "A door that opens while the vehicle is moving can eject an occupant.",
  },
  {
    id: "sunroof-shatter",
    name: "Sunroof / panoramic roof spontaneously shattering",
    componentHints: ["STRUCTURE", "VISIBILITY"],
    include: [
      s(/\b(?:sun|moon|panoramic|pano|glass)\s?roof\s+(?:\w+\s+){0,4}?(?:shatter\w*|explod\w*|burst|broke|cracked)/),
      s(/\b(?:shatter\w*|explod\w*)\s+(?:\w+\s+){0,3}?(?:sun|moon|panoramic|pano|glass)\s?roof/),
    ],
    exclude: [],
    coverageTerms: [s(/\b(?:sun|moon|panoramic|glass)\s?roof/)],
    hazard: "Glass falling from a shattering roof panel can cut occupants and startle the driver at speed.",
  },
  {
    id: "windshield-crack",
    name: "Windshield cracking without impact",
    componentHints: ["VISIBILITY", "VISIBILITY:WINDSHIELD"],
    include: [
      s(/\bwind(?:shield|screen)\s+(?:\w+\s+){0,5}?(?:crack\w*|shatter\w*|split)\s+(?:\w+\s+){0,10}?(?:no\s+(?:\w+\s+){0,2}?(?:impact|rock|stone|debris|chip|reason|cause|point\s+of\s+impact)|without\s+(?:\w+\s+){0,2}?(?:impact|reason|cause|being\s+hit)|on\s+(?:its|it'?s)\s+own|spontaneous\w*|for\s+no\s+reason|nothing\s+hit)/),
      s(/\b(?:spontaneous\w*|randomly|suddenly)\s+(?:\w+\s+){0,2}?crack\w*\s+(?:\w+\s+){0,3}?wind(?:shield|screen)/),
      s(/\bstress\s+crack\w*\s+(?:\w+\s+){0,4}?wind(?:shield|screen)|\bwind(?:shield|screen)\s+(?:\w+\s+){0,4}?stress\s+crack/),
    ],
    exclude: [],
    coverageTerms: [s(/\bwind(?:shield|screen)/)],
    hazard: "A spreading windshield crack obstructs the driver's view.",
  },
  {
    id: "wiper-failure",
    name: "Windshield wiper failure",
    componentHints: ["VISIBILITY", "VISIBILITY:WINDSHIELD WIPER/WASHER"],
    include: [
      s(/\bwipers?\s+(?:\w+\s+){0,4}?(?:fail\w*|stopped\s+working|stop\s+working|not\s+work\w*|quit|went\s+out|stuck|inoperative|intermittent\w*|did\s+not\s+(?:work|turn\s+on|function)|would\s+not\s+(?:work|turn\s+(?:on|off)))/),
      s(/\bwiper\s+(?:motor|linkage|arm|transmission|module)\s+(?:\w+\s+){0,3}?(?:fail\w*|broke\w*|seiz\w*|bad|replac\w*)/),
    ],
    exclude: [],
    coverageTerms: [s(/\bwipers?/), s(/\bfmvss\s+(?:no\.\s*)?104\b/)],
    hazard: "Wipers that stop in rain or snow can leave the driver unable to see the road.",
  },
  {
    id: "tire-tread-separation",
    name: "Tire tread separation / blowout",
    componentHints: ["TIRES", "WHEELS"],
    include: [
      s(/\btread\s+(?:\w+\s+){0,2}?(?:separat\w*|came\s+off|peel\w*|delaminat\w*)/),
      s(/\btires?\s+(?:\w+\s+){0,3}?(?:blew\s+out|blowout|exploded|separated|delaminat\w*|sidewall\s+(?:bubble|failure|blew|split))/),
      s(/\b(?:blowout|blow[\s-]out)\b/),
    ],
    exclude: [],
    coverageTerms: [s(/\btread\s+separation/), s(/\btires?\b/), s(/\bfmvss\s+(?:no\.\s*)?139\b/)],
    hazard: "A tread separation or blowout at speed can cause a loss of vehicle control.",
  },
  {
    id: "suspension-break",
    name: "Suspension component fracture (coil spring, ball joint, control arm)",
    componentHints: ["SUSPENSION", "SUSPENSION:FRONT", "SUSPENSION:REAR"],
    include: [
      s(/\b(?:coil\s+springs?|springs?|ball\s+joints?|control\s+arms?|tie\s+rods?|lower\s+arms?|knuckles?|axle\s+shafts?|struts?|wheel\s+hubs?|sway\s+bar\s+links?|track\s+bar)\s+(?:\w+\s+){0,3}?(?:broke\w*|snapped|fractur\w*|separat\w*|cracked|sheared|fell\s+(?:off|out)|came\s+(?:apart|off|loose)|detached|failed)/),
      s(/\b(?:broken|snapped|fractured|cracked|separated|failed)\s+(?:\w+\s+){0,2}?(?:coil\s+springs?|ball\s+joints?|control\s+arms?|tie\s+rods?|knuckles?|axle\s+shafts?|struts?|track\s+bar)/),
      s(/\b(?:wheel|tire)\s+(?:\w+\s+){0,2}?(?:fell|came|flew)\s+off\b/),
    ],
    exclude: [s(/\b(?:after|in)\s+(?:the|a)\s+(?:crash|collision|accident)\b/)],
    coverageTerms: [
      s(/\b(?:coil\s+spring|ball\s+joint|control\s+arm|tie\s+rod|knuckle|strut|track\s+bar|axle\s+shaft|wheel\s+hub)s?\b/),
      s(/\bsuspension.{0,40}(?:fractur|separat|break|crack)/),
    ],
    hazard: "A fractured suspension or steering link can cause a sudden loss of steering control.",
  },
  {
    id: "display-blackout",
    name: "Dashboard / infotainment blackout or reboot (cameras, gauges lost)",
    componentHints: ["ELECTRICAL SYSTEM", "BACK OVER PREVENTION", "VISIBILITY"],
    include: [
      s(/\b(?:screen|display|infotainment|radio|uconnect|touch\s?screen|mcu|head\s+unit|instrument\s+(?:cluster|panel)|dash(?:board)?|gauges?)\s+(?:\w+\s+){0,4}?(?:went\s+(?:black|blank|dark|out)|goes\s+(?:black|blank|dark)|black(?:ed)?\s+out|blank\w*|reboot\w*|restart\w*|froze|freez\w*|frozen|shut\s+(?:off|down)|crash(?:ed|es)?|cut\s+out)/),
      s(/\b(?:black|blank)\s+(?:\w+\s+){0,1}?(?:screen|display)\b/),
      s(/\b(?:lost|loss\s+of)\s+(?:all\s+)?(?:gauges|speedometer|instrument\s+cluster|dash(?:board)?\s+(?:lights|display))\b/),
    ],
    exclude: [],
    coverageTerms: [
      s(/\b(?:center|touch|infotainment|media\s+control|display)\s+(?:screen|display|unit)/),
      s(/\binstrument\s+(?:panel|cluster)/),
      s(/\bemmc|\bmcu\b|\breboot/),
      s(/\brear[\s-]?view\s+(?:camera|image)/),
    ],
    hazard:
      "Loss of the central display or instrument cluster can remove the rearview image, speed display, warnings and defrost controls while driving.",
  },
  {
    id: "lane-keep-intervention",
    name: "Lane-keeping steering intervention (unexpected steering input)",
    componentHints: ["LANE DEPARTURE", "STEERING"],
    include: [
      s(/\blane\s+(?:keep\w*|assist\w*|centering|departure|following)\s+(?:\w+\s+){0,10}?(?:jerk\w*|yank\w*|pull\w*|steer\w*|swerv\w*|turn\w*|veer\w*)\s+(?:\w+\s+){0,6}?(?:into|toward|towards|across|off|out\s+of|the\s+(?:wheel|car|vehicle))/),
      s(/\b(?:steering\s+wheel|car|vehicle)\s+(?:\w+\s+){0,3}?(?:jerk\w*|yank\w*|swerv\w*|turn\w*|veer\w*)\s+(?:\w+\s+){0,4}?(?:on\s+its\s+own|by\s+itself|without\s+(?:\w+\s+){0,2}?input)/),
      s(/\b(?:auto\s?steer|autosteer)\s+(?:\w+\s+){0,6}?(?:jerk\w*|yank\w*|swerv\w*|veer\w*)/),
    ],
    exclude: [],
    coverageTerms: [s(/\blane\s+(?:keep|depart|center|assist)/), s(/\bauto\s?steer/), s(/\bunexpected\s+steering/)],
    hazard: "An unexpected steering input from a driver-assist system can move the vehicle out of its lane or into another vehicle.",
  },
];

export const SEED_MODES: FailureMode[] = [...MODES_A, ...MODES_B];

/** Compile a mode's include/exclude/coverage sources (case-insensitive). */
export function compileMode(mode: FailureMode): { include: RegExp[]; exclude: RegExp[]; coverage: RegExp[] } {
  return {
    include: mode.include.map((src) => new RegExp(src, "i")),
    exclude: mode.exclude.map((src) => new RegExp(src, "i")),
    coverage: mode.coverageTerms.map((src) => new RegExp(src, "i")),
  };
}

/** Regex-only match of a narrative against one mode (labels and component hints not applied). */
export function matchesMode(text: string, mode: FailureMode | ReturnType<typeof compileMode>): boolean {
  const c = "id" in mode ? compileMode(mode) : mode;
  if (!c.include.some((r) => r.test(text))) return false;
  return !c.exclude.some((r) => r.test(text));
}

// Only settlements we can source. Reynolds v. FCA US LLC: extended 8-year / 90,000-mile
// steering-damper warranty for 2018-2020 Wrangler (JL) and 2020 Gladiator (JT).
const REYNOLDS_URL = "https://thedrive.com/news/jeep-agrees-to-settlement-over-wrangler-gladiator-death-wobble";
const REYNOLDS_SUMMARY =
  "Class settlement of death-wobble claims. Provides an extended steering-damper warranty (8 years / 90,000 miles). " +
  "A settlement warranty is not a safety recall.";

export const SEED_SETTLEMENTS: Settlement[] = [
  {
    id: "reynolds-v-fca-wrangler",
    name: "Reynolds v. FCA (death wobble)",
    make: "JEEP",
    model: "WRANGLER",
    yearFrom: 2018,
    yearTo: 2020,
    failureModeId: "death-wobble",
    url: REYNOLDS_URL,
    summary: REYNOLDS_SUMMARY,
  },
  {
    id: "reynolds-v-fca-gladiator",
    name: "Reynolds v. FCA (death wobble)",
    make: "JEEP",
    model: "GLADIATOR",
    yearFrom: 2020,
    yearTo: 2020,
    failureModeId: "death-wobble",
    url: REYNOLDS_URL,
    summary: REYNOLDS_SUMMARY,
  },
];

const p = (make: string, model: string) => ({ make, model });

/** Same-segment peers for the baseline share. Keyed "MAKE|MODEL" (uppercase, NHTSA naming). */
export const DEFAULT_PEERS: Record<string, { make: string; model: string }[]> = {
  "JEEP|WRANGLER": [p("FORD", "BRONCO"), p("TOYOTA", "4RUNNER")],
  "JEEP|GLADIATOR": [p("TOYOTA", "TACOMA"), p("FORD", "RANGER")],
  "TESLA|MODEL 3": [p("CHEVROLET", "BOLT EV"), p("HYUNDAI", "IONIQ 5"), p("POLESTAR", "2")],
  "TESLA|MODEL Y": [p("FORD", "MUSTANG MACH-E"), p("HYUNDAI", "IONIQ 5"), p("KIA", "EV6")],
  "HYUNDAI|SONATA": [p("TOYOTA", "CAMRY"), p("HONDA", "ACCORD"), p("FORD", "FUSION")],
  "KIA|OPTIMA": [p("TOYOTA", "CAMRY"), p("HONDA", "ACCORD"), p("FORD", "FUSION")],
  "KIA|K5": [p("TOYOTA", "CAMRY"), p("HONDA", "ACCORD"), p("NISSAN", "ALTIMA")],
  "HYUNDAI|SANTA FE SPORT": [p("TOYOTA", "RAV4"), p("HONDA", "CR-V"), p("FORD", "ESCAPE")],
  "KIA|SORENTO": [p("TOYOTA", "HIGHLANDER"), p("HONDA", "PILOT"), p("FORD", "EDGE")],
  "KIA|SPORTAGE": [p("TOYOTA", "RAV4"), p("HONDA", "CR-V"), p("FORD", "ESCAPE")],
  "HYUNDAI|IONIQ 5": [p("FORD", "MUSTANG MACH-E"), p("TESLA", "MODEL Y"), p("VOLKSWAGEN", "ID.4")],
  "KIA|EV6": [p("FORD", "MUSTANG MACH-E"), p("TESLA", "MODEL Y"), p("VOLKSWAGEN", "ID.4")],
  "CHEVROLET|BOLT EV": [p("NISSAN", "LEAF"), p("HYUNDAI", "KONA ELECTRIC")],
  "FORD|EXPLORER": [p("TOYOTA", "HIGHLANDER"), p("HONDA", "PILOT"), p("CHEVROLET", "TRAVERSE")],
  "FORD|BRONCO": [p("JEEP", "WRANGLER"), p("TOYOTA", "4RUNNER")],
};

export function peersFor(make: string, model: string): { make: string; model: string }[] {
  return DEFAULT_PEERS[`${make.toUpperCase()}|${model.toUpperCase()}`] ?? [];
}
