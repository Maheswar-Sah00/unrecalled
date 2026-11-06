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
    coverageTerms: [], // see COVERAGE_TERMS
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
    coverageTerms: [], // see COVERAGE_TERMS
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
    coverageTerms: [], // see COVERAGE_TERMS
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
    coverageTerms: [], // see COVERAGE_TERMS
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
    coverageTerms: [], // see COVERAGE_TERMS
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
    coverageTerms: [], // see COVERAGE_TERMS
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
    coverageTerms: [], // see COVERAGE_TERMS
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
    coverageTerms: [], // see COVERAGE_TERMS
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
    coverageTerms: [], // see COVERAGE_TERMS
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
    coverageTerms: [], // see COVERAGE_TERMS
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
    coverageTerms: [], // see COVERAGE_TERMS
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
    coverageTerms: [], // see COVERAGE_TERMS
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
    coverageTerms: [], // see COVERAGE_TERMS
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
    coverageTerms: [], // see COVERAGE_TERMS
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
    coverageTerms: [], // see COVERAGE_TERMS
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
    coverageTerms: [], // see COVERAGE_TERMS
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
    coverageTerms: [], // see COVERAGE_TERMS
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
    coverageTerms: [], // see COVERAGE_TERMS
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
    coverageTerms: [], // see COVERAGE_TERMS
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
    coverageTerms: [], // see COVERAGE_TERMS
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
    coverageTerms: [], // see COVERAGE_TERMS
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
    coverageTerms: [], // see COVERAGE_TERMS
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
    coverageTerms: [], // see COVERAGE_TERMS
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
    coverageTerms: [], // see COVERAGE_TERMS
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
    coverageTerms: [], // see COVERAGE_TERMS
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
    coverageTerms: [], // see COVERAGE_TERMS
    hazard: "An unexpected steering input from a driver-assist system can move the vehicle out of its lane or into another vehicle.",
  },
];

// Coverage terms: regexes matched against recall summary + consequence + remedy and investigation
// subject + summary (NOT the NHTSA component label). Each term describes the defect itself, so a
// recall only counts as coverage when it addresses this failure mode. Validated against 189 recalls
// and 52 investigations with scripts/validate-coverage.ts.
const SHAKE = String.raw`(?:shimm(?:y|ies|ying)|wobbl\w*|oscillat\w*)`;
const COVERAGE_TERMS: Record<string, string[]> = {
  "death-wobble": [
    s(/\bdeath\s+wobble/),
    s(/\bsteering\s+(?:damper|dampener|stabili[sz]er)s?\b/),
    String.raw`\b(?:steering(?:\s+wheel)?|front[\s-]end|front\s+(?:axle|suspension))\s+(?:\w+\s+){0,2}?${SHAKE}`,
    String.raw`\b${SHAKE}\s+(?:\w+\s+){0,3}?(?:of|in)\s+(?:the\s+)?(?:steering|front[\s-]end|front\s+(?:axle|suspension))`,
  ],
  "phantom-braking": [
    s(/\bphantom\s+brak/),
    s(/\b(?:unexpected|unintended|unintentional|inadvertent|false|unrequested|erroneous|unnecessary)\s+(?:and\s+\w+\s+)?(?:\w+\s+){0,3}?(?:automatic\s+emergency\s+brak\w*|aeb|brak(?:e|ing)\s+activation|(?:vehicle\s+)?deceleration|brak(?:e|ing)\s+application|collision\s+mitigation\s+brak\w*)/),
    s(/\b(?:automatic\s+emergency\s+brak\w*|aeb|collision\s+mitigation\s+brak\w*)\b[^.]{0,60}\b(?:activat\w*|engag\w*|appl(?:y|ies|ied))\s+(?:\w+\s+){0,3}?(?:unexpectedly|inadvertently|with\s+no\s+(?:apparent\s+)?(?:obstruction|obstacle|object)|when\s+(?:there\s+is\s+)?no)/),
    s(/\bsudden\s+(?:vehicle\s+)?deceleration\b[^.]{0,80}\bno\s+(?:apparent\s+)?(?:obstruction|obstacle|object|vehicle)/),
    s(/\bno\s+(?:apparent\s+)?(?:obstruction|obstacle)\b[^.]{0,80}\bsudden\s+(?:vehicle\s+)?deceleration/),
  ],
  "engine-seizure": [
    s(/\bconnecting[\s-]rods?\b/),
    s(/\b(?:rod|crankshaft|crank|main|engine)\s+bearings?\b/),
    s(/\bbearing\s+(?:wear|damage|failure|seiz\w*)/),
    s(/\bengine\s+(?:seizure|seiz\w*)/),
    s(/\bmachining\s+(?:errors?|debris)\b/),
    s(/\b(?:metallic\s+)?debris\b[^.]{0,80}\bcrankshaft/),
  ],
  "stall-while-driving": [
    s(/\b(?:engine\s+)?stall(?:s|ed|ing)?\b/),
    s(/\bloss\s+of\s+(?:all\s+)?(?:motive|drive|motor)\s+power/),
    s(/\bloss\s+of\s+propulsion/),
    s(/\b(?:engine|vehicle|powertrain)\s+(?:may\s+)?(?:shut\s*down|shut\s+off)\b|\bengine\s+shutdown\b/),
    s(/\blose\s+(?:all\s+)?(?:motive|drive|motor)\s+power/),
  ],
  "iccu-12v-power-loss": [
    s(/\biccu\b/),
    s(/\bintegrated\s+charging\s+control\s+unit/),
    s(/\b(?:stop|not|inability\s+to)\s+(?:\w+\s+){0,1}?charg\w*\s+(?:the\s+)?12[\s-]?v(?:olt)?\b/),
    s(/\b12[\s-]?v(?:olt)?\s+(?:auxiliary\s+|low[\s-]voltage\s+)?battery\b[^.]{0,80}\b(?:discharg\w*|not\s+(?:be\s+)?charg\w*|stop\w*\s+charg\w*|loss\s+of\s+(?:drive|motive)\s+power)/),
    s(/\b(?:ldc|low[\s-]voltage\s+dc[\s/-]?dc\s+converter)\b/),
  ],
  "unintended-acceleration": [
    s(/\b(?:unintended|sudden|unexpected|uncommanded|unintentional)\s+(?:\w+\s+){0,1}?acceleration/),
    s(/\baccelerator\s+pedal\b[^.]{0,60}\b(?:stick\w*|stuck|entrap\w*|not\s+return|fail\w*\s+to\s+return)/),
    s(/\bthrottle\b[^.]{0,40}\b(?:stick\w*|stuck|remain\w*\s+open|open\s+unexpectedly)/),
    s(/\bcruise\s+control\b[^.]{0,60}\b(?:from\s+disengaging|not\s+disengage|fail\w*\s+to\s+disengage)/),
  ],
  "brake-loss": [
    s(/\b(?:loss|lose|reduc\w*|decreas\w*|degrad\w*)\s+(?:of\s+)?(?:\w+\s+){0,2}?(?:brak\w*|stopping)\s+(?:\w+\s+){0,1}?(?:assist|power|performance|pressure|capability|ability|function)/),
    s(/\bbrake\s+fluid\s+(?:may\s+)?(?:\w+\s+)?leak\w*(?!\s+(?:inside|into|within)\s+the\s+(?:hydraulic|hecu|abs|anti))/),
    s(/\bbrake\s+(?:lines?|hoses?|booster|master\s+cylinder)\b[^.]{0,80}\b(?:leak\w*|fail\w*|crack\w*|detach\w*|separat\w*)/),
    s(/\bbrake\s+calipers?\b[^.]{0,60}\b(?:fractur\w*|crack\w*|separat\w*|detach\w*|loose)/),
    s(/\bincreas\w*\s+(?:the\s+)?(?:vehicle'?s?\s+)?stopping\s+distance/),
  ],
  "power-steering-loss": [
    s(/\b(?:loss|lose|losing|reduc\w*|reduction)\s+(?:of\s+)?(?:\w+\s+){0,2}?(?:power\s+)?steering\s+assist/),
    s(/\bsteering\s+assist\s+(?:may\s+be\s+)?(?:reduced|lost|disabled)/),
    s(/\bincreas\w*\s+(?:in\s+)?(?:the\s+)?(?:\w+\s+){0,1}?steering\s+effort/),
    s(/\bloss\s+of\s+(?:electronic\s+|electric\s+)?power[\s-](?:assisted\s+)?steering/),
  ],
  "airbag-non-deployment": [
    s(/\bair\s?bags?\b[^.]{0,80}\b(?:not|fail\w*\s+to)\s+(?:properly\s+|correctly\s+)?deploy/),
    s(/\bprevent\w*\b[^.]{0,60}?\bair\s?bags?\b[^.]{0,60}?\bfrom\s+deploying/),
    s(/\b(?:air\s?bags?|second\s+stage)\b[^.]{0,40}\bnot\s+deploying/),
    s(/\bdisabl\w*\s+(?:the\s+)?(?:\w+\s+){0,2}?air\s?bags?/),
    s(/\bair\s?bags?\s+(?:may\s+be\s+)?disabled/),
    s(/\bfailure\s+of\s+(?:the\s+)?(?:\w+\s+){0,2}?air\s?bags?\s+to\s+deploy/),
  ],
  "airbag-warning-light": [
    s(/\b(?:air\s?bag|srs|supplemental\s+restraint)\s+(?:system\s+)?(?:warning\s+)?(?:light|lamp|telltale|indicator)/),
    s(/\bpassenger\s+air\s?bag\s+(?:off|on)\s+indicator/),
    s(/\bclock\s?spring/),
  ],
  "seat-belt-failure": [
    s(/\bseat\s?belts?\b[^.]{0,80}\b(?:detach\w*|fractur\w*|separat\w*|unlatch\w*|not\s+(?:properly\s+)?(?:latch|lock|restrain|attached|secured)\w*|loose)/),
    s(/\bpretensioners?\b[^.]{0,60}\b(?:failure|fail\w*\s+to|not\s+deploy|detach\w*|missing)/),
    s(/\bbuckles?\b[^.]{0,80}\b(?:fractur\w*|separat\w*|detach\w*|not\s+(?:be\s+)?(?:properly\s+)?secured|prevent\w*\s+(?:\w+\s+){0,4}?(?:fastening|latching))/),
    s(/\bretractors?\b[^.]{0,80}\b(?:not\s+(?:\w+\s+)?(?:lock|attached|slow)\w*|detach\w*|fail\w*)/),
    s(/\b(?:seat\s?belt|buckle|retractor)\s+(?:\w+\s+){0,2}?anchor\w*\b[^.]{0,60}\b(?:loose|improperly|not\s+(?:be\s+)?(?:properly\s+)?secured|detach\w*|fail\w*)/),
  ],
  "rollaway-park": [
    s(/\broll[\s-]?away/),
    s(/\bpark(?:ing)?\s+(?:pawl|lock\s+rod|gear|mechanism|wheel)\b[^.]{0,80}\b(?:not|fail\w*|disengag\w*|engag\w*)/),
    s(/\b(?:not|fail\w*\s+to)\s+(?:\w+\s+){0,2}?engag\w*\s+(?:\w+\s+){0,2}?park/),
    s(/\bvehicle\s+(?:may\s+|to\s+)?(?:roll|move)\s+(?:\w+\s+){0,3}?(?:unexpectedly|away)/),
    s(/\bpark\s+lock\s+rod|\bshift\s+cable\b[^.]{0,60}\bdetach/),
  ],
  "transmission-shudder": [
    s(/\b(?:harsh|delayed|unexpected|unintended|abrupt)\s+(?:\w+\s+){0,1}?(?:down|up)?shift(?:s|ing)?\b/),
    s(/\btorque\s+converter/),
    s(/\btransmission\b[^.]{0,80}\b(?:shudder\w*|slip\w*|lurch\w*|jerk\w*|unexpected\s+(?:gear|downshift))/),
    s(/\bunexpected\s+(?:\w+\s+){0,2}?gear\s+(?:change|shift)/),
  ],
  "fuel-leak": [
    s(/(?<!\brisk\s+of\s+)\bfuel\s+(?:\w+\s+){0,3}?leak\w*/),
    s(/\bleak\w*\s+(?:of\s+)?fuel\b/),
    s(/\bfuel\s+(?:lines?|hoses?|pipes?|tanks?|rails?|filler(?:\s+tube)?|supply\s+(?:line|pipe)s?)\b[^.]{0,80}\b(?:crack\w*|disconnect\w*|punctur\w*|chaf\w*|loose)/),
    s(/\bfuel\s+(?:odou?r|smell)/),
  ],
  "vehicle-fire": [
    s(/\b(?:catch|catches|caught|cause|causing|result\s+in|resulting\s+in|lead\s+to|leading\s+to|ignite)\s+(?:an?\s+)?(?:\w+\s+){0,2}?fires?\b/),
    s(/\bfires?\s+(?:while|even\s+when)\s+(?:\w+\s+){0,2}?(?:parked|driving|off)/),
    s(/\b(?:non-crash|underhood|engine\s+compartment|battery)\s+(?:\w+\s+){0,1}?fires?\b/),
    s(/\bthermal\s+(?:runaway|events?|incidents?)/),
  ],
  "oil-consumption": [
    s(/\boil\s+consumption/),
    s(/\b(?:excessive|abnormal)\s+(?:engine\s+)?oil\s+(?:use|loss|burn\w*)/),
    s(/\bpiston\s+rings?/),
    s(/\blow\s+(?:engine\s+)?oil\s+level/),
  ],
  "headlight-failure": [
    s(/\bhead[\s-]?(?:light|lamp)s?\b[^.]{0,80}\b(?:fail\w*|inoperative|not\s+(?:\w+\s+)?(?:illuminate|work|function)|flicker\w*|go\s+out|condensation|moisture|water)/),
    s(/\b(?:low|high)[\s-]beams?\b[^.]{0,60}\b(?:fail\w*|inoperative|not\s+(?:\w+\s+)?(?:illuminate|work|function))/),
  ],
  "backup-camera-failure": [
    s(/\b(?:rear[\s-]?view|back[\s-]?up|reverse)\s+(?:camera\s+)?(?:image|camera|display|video)\b[^.]{0,80}\b(?:not|fail\w*|blank|distort\w*|delay\w*|black|flip|invert\w*|freez\w*|remain\w*|loss)/),
    s(/\b(?:prevent\w*|disabl\w*|loss\s+of)\s+(?:the\s+)?(?:rear[\s-]?view|back[\s-]?up)\s+(?:camera\s+)?(?:image|camera)/),
    s(/\b(?:standard|fmvss)\s+(?:number\s+|no\.\s*)?111\b/),
  ],
  "door-latch": [
    s(/\b(?:door|liftgate|tailgate)\s+(?:\w+\s+){0,2}?latch\w*/),
    s(/\bdoors?\s+(?:to\s+|may\s+|could\s+|can\s+|opens?\s+)?(?:\w+\s+){0,1}?(?:open|unlatch)\w*\s+(?:\w+\s+){0,3}?(?:while\s+(?:driving|moving|in\s+motion)|unexpectedly|unintentionally|in\s+(?:a|the\s+event\s+of\s+a)\s+crash|during\s+a\s+crash)/),
    s(/\b(?:standard|fmvss)\s+(?:number\s+|no\.\s*)?206\b|\bdoor\s+(?:locks\s+and\s+door\s+)?retention/),
  ],
  "sunroof-shatter": [
    s(/\b(?:sun|moon|panoramic|glass)\s?roof\b[^.]{0,80}\b(?:shatter\w*|break\w*|broke|crack\w*|detach\w*|separat\w*|fall\w*)/),
  ],
  "windshield-crack": [s(/\bwind(?:shield|screen)\b[^.]{0,80}\b(?:crack\w*|shatter\w*|fractur\w*|break\w*)/)],
  "wiper-failure": [
    s(/\bwipers?\b[^.]{0,80}\b(?:fail\w*|not\s+(?:\w+\s+)?(?:operat\w*|work\w*|function\w*)|inoperative|stop\w*)/),
    s(/\bwiper\s+motor/),
    s(/\b(?:standard|fmvss)\s+(?:number\s+|no\.\s*)?104\b/),
  ],
  "tire-tread-separation": [
    s(/\btread\s+(?:\w+\s+)?separat\w*/),
    s(/\btires?\b[^.]{0,60}\b(?:separat\w*|delaminat\w*|sidewall\s+(?:\w+\s+)?(?:crack|bulg|fail)\w*|rapid\s+air\s+loss|bulg\w*)/),
    s(/\b(?:standard|fmvss)\s+(?:number\s+|no\.\s*)?139\b/),
  ],
  "suspension-break": [
    s(/\b(?:coil\s+springs?|ball\s+joints?|control\s+arms?|tie[\s-]rods?|knuckles?|lateral\s+links?|suspension\s+links?|sub-?frames?|axle\s+shafts?|struts?|track\s+bar(?:\s+brackets?)?|wheel\s+hubs?|toe\s+links?)\b[^.]{0,100}\b(?:fractur\w*|break\w*|broke|separat\w*|detach\w*|crack\w*|loosen\w*|loose|not\s+(?:have\s+)?(?:been\s+)?(?:properly|correctly|securely)\s+(?:tightened|attached|welded|positioned|secured)|improperly\s+welded)/),
    s(/\b(?:fractur\w*|separat\w*|detach\w*)\s+(?:\w+\s+){0,4}?(?:suspension|knuckle|control\s+arm|lateral\s+link|sub-?frame)/),
  ],
  "display-blackout": [
    s(/\b(?:center|central|infotainment|touch|integrated\s+computer|radio)\s+(?:\w+\s+){0,2}?(?:screen|display|unit)\b[^.]{0,100}\b(?:blank|black|reboot\w*|restart\w*|freez\w*|lag|fail\w*|flip|invert\w*)/),
    s(/\binstrument\s+(?:panel\s+)?clusters?\b[^.]{0,80}\b(?:fail\w*|blank|short|reset|inoperative|malfunction\w*|not\s+display)/),
    s(/\b(?:cpu|mcu|emmc|computer|processor|circuit\s+board)\b[^.]{0,80}\b(?:overheat\w*|lag|restart\w*|reboot\w*|fail\w*|short\w*|wear)\w*[^.]{0,100}\b(?:display|screen|image|camera|cluster|infotainment|gauges?)\b/),
  ],
  "lane-keep-intervention": [
    s(/\blane\s+(?:keep\w*|departure|centering|assist)\b[^.]{0,80}\b(?:unexpected\w*|unintended|inadvertent\w*|steer\w*\s+(?:into|toward))/),
    s(/\bauto\s?steer\b[^.]{0,80}\b(?:unexpected\w*|unintended|jerk\w*|swerv\w*|veer\w*)/),
    s(/\b(?:unexpected|unintended|uncommanded|inadvertent)\s+steering\s+(?:input|intervention|torque|correction)/),
  ],
};

export const SEED_MODES: FailureMode[] = [...MODES_A, ...MODES_B].map((m) => ({
  ...m,
  coverageTerms: COVERAGE_TERMS[m.id] ?? [],
}));

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
