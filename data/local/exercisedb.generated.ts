export type ExerciseDbExercise = {
  bodyPart: string | null;
  category: string | null;
  description: string | null;
  difficulty: string | null;
  equipment: string | null;
  id: string;
  imageAssetId: string;
  instructions: string[];
  name: string;
  secondaryMuscles: string[];
  target: string | null;
};

export const EXERCISE_DB_EXERCISES: ExerciseDbExercise[] = [
  {
    "bodyPart": "waist",
    "category": "strength",
    "description": "The 3/4 sit-up is an abdominal exercise performed with body weight. It involves curling the torso up to a 45-degree angle, engaging the abs, hip flexors, and lower back. This movement is commonly used to build core strength and stability.",
    "difficulty": "beginner",
    "equipment": "body weight",
    "id": "0001",
    "imageAssetId": "0001",
    "instructions": [
      "Lie flat on your back with your knees bent and feet flat on the ground.",
      "Place your hands behind your head with your elbows pointing outwards.",
      "Engaging your abs, slowly lift your upper body off the ground, curling forward until your torso is at a 45-degree angle.",
      "Pause for a moment at the top, then slowly lower your upper body back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "3/4 Sit-up",
    "secondaryMuscles": [
      "Hip Flexors",
      "Lower Back"
    ],
    "target": "Abs"
  },
  {
    "bodyPart": "waist",
    "category": "strength",
    "description": "The 45° side bend is a bodyweight exercise targeting the abdominal muscles, particularly the obliques. It involves bending the torso to the side while standing, engaging the core for stability and control.",
    "difficulty": "beginner",
    "equipment": "body weight",
    "id": "0002",
    "imageAssetId": "0002",
    "instructions": [
      "Stand with your feet shoulder-width apart and your arms extended straight down by your sides.",
      "Keeping your back straight and your core engaged, slowly bend your torso to one side, lowering your hand towards your knee.",
      "Pause for a moment at the bottom, then slowly return to the starting position.",
      "Repeat on the other side.",
      "Continue alternating sides for the desired number of repetitions."
    ],
    "name": "45° Side Bend",
    "secondaryMuscles": [
      "Obliques"
    ],
    "target": "Abs"
  },
  {
    "bodyPart": "waist",
    "category": "strength",
    "description": "The air bike is a bodyweight exercise targeting the abdominal muscles and hip flexors. It involves a pedaling motion while lying on your back, alternating elbow-to-knee contact to engage the core.",
    "difficulty": "beginner",
    "equipment": "body weight",
    "id": "0003",
    "imageAssetId": "0003",
    "instructions": [
      "Lie flat on your back with your hands placed behind your head.",
      "Lift your legs off the ground and bend your knees at a 90-degree angle.",
      "Bring your right elbow towards your left knee while simultaneously straightening your right leg.",
      "Return to the starting position and repeat the movement on the opposite side, bringing your left elbow towards your right knee while straightening your left leg.",
      "Continue alternating sides in a pedaling motion for the desired number of repetitions."
    ],
    "name": "Air Bike",
    "secondaryMuscles": [
      "Hip Flexors"
    ],
    "target": "Abs"
  },
  {
    "bodyPart": "waist",
    "category": "strength",
    "description": "Alternate heel touchers is a bodyweight exercise targeting the abdominal muscles, particularly the obliques. It involves lying on your back, lifting your shoulders, and reaching side to side to touch your heels, engaging your core throughout.",
    "difficulty": "beginner",
    "equipment": "body weight",
    "id": "0006",
    "imageAssetId": "0006",
    "instructions": [
      "Lie flat on your back with your knees bent and feet flat on the ground.",
      "Extend your arms straight out to the sides, parallel to the ground.",
      "Engaging your abs, lift your shoulders off the ground and reach your right hand towards your right heel.",
      "Return to the starting position and repeat on the left side, reaching your left hand towards your left heel.",
      "Continue alternating sides for the desired number of repetitions."
    ],
    "name": "Alternate Heel Touchers",
    "secondaryMuscles": [
      "Obliques"
    ],
    "target": "Abs"
  },
  {
    "bodyPart": "back",
    "category": "strength",
    "description": "The alternate lateral pulldown is a cable machine exercise targeting the latissimus dorsi, with secondary emphasis on the biceps and rhomboids. It involves pulling handles towards the chest in an alternating fashion, focusing on back strength and muscle engagement.",
    "difficulty": "beginner",
    "equipment": "cable",
    "id": "0007",
    "imageAssetId": "0007",
    "instructions": [
      "Sit on the cable machine with your back straight and feet flat on the ground.",
      "Grasp the handles with an overhand grip, slightly wider than shoulder-width apart.",
      "Lean back slightly and pull the handles towards your chest, squeezing your shoulder blades together.",
      "Pause for a moment at the peak of the movement, then slowly release the handles back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Alternate Lateral Pulldown",
    "secondaryMuscles": [
      "Biceps",
      "Rhomboids"
    ],
    "target": "Lats"
  },
  {
    "bodyPart": "lower legs",
    "category": "mobility",
    "description": "Ankle circles are a bodyweight exercise that targets the calves and ankle stabilizers. This movement involves rotating the ankle in a circular motion while seated, helping to improve mobility and flexibility in the ankle joint.",
    "difficulty": "beginner",
    "equipment": "body weight",
    "id": "1368",
    "imageAssetId": "1368",
    "instructions": [
      "Sit on the ground with your legs extended in front of you.",
      "Lift one leg off the ground and rotate your ankle in a circular motion.",
      "Perform the desired number of circles in one direction, then switch to the other direction.",
      "Repeat with the other leg."
    ],
    "name": "Ankle Circles",
    "secondaryMuscles": [
      "Ankle Stabilizers"
    ],
    "target": "Calves"
  },
  {
    "bodyPart": "chest",
    "category": "strength",
    "description": "The assisted chest dip (kneeling) is a chest-focused exercise performed on a leverage machine, where the user kneels on a pad for support. This machine-assisted variation helps reduce the load, making it accessible for those building strength or learning proper dip technique.",
    "difficulty": "beginner",
    "equipment": "leverage machine",
    "id": "0009",
    "imageAssetId": "0009",
    "instructions": [
      "Adjust the machine to your desired height and secure your knees on the pad.",
      "Grasp the handles with your palms facing down and your arms fully extended.",
      "Lower your body by bending your elbows until your upper arms are parallel to the floor.",
      "Pause for a moment, then push yourself back up to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Assisted Chest Dip (kneeling)",
    "secondaryMuscles": [
      "Triceps",
      "Shoulders"
    ],
    "target": "Pectorals"
  },
  {
    "bodyPart": "waist",
    "category": "strength",
    "description": "The assisted hanging knee raise is an abdominal exercise performed while hanging from a pull-up bar, using assistance to help lift the knees toward the chest. It primarily targets the abs and also works the hip flexors.",
    "difficulty": "beginner",
    "equipment": "assisted",
    "id": "0011",
    "imageAssetId": "0011",
    "instructions": [
      "Hang from a pull-up bar with your arms fully extended and your palms facing away from you.",
      "Engage your core muscles and lift your knees towards your chest, bending at the hips and knees.",
      "Pause for a moment at the top of the movement, squeezing your abs.",
      "Slowly lower your legs back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Assisted Hanging Knee Raise",
    "secondaryMuscles": [
      "Hip Flexors"
    ],
    "target": "Abs"
  },
  {
    "bodyPart": "waist",
    "category": "strength",
    "description": "The assisted hanging knee raise with throw down is an advanced core exercise that targets the abdominal muscles, with additional engagement of the hip flexors and lower back. The movement involves hanging from a pull-up bar, raising the knees to the chest, and then explosively throwing the legs downward, requiring significant core strength, coordination, and control.",
    "difficulty": "advanced",
    "equipment": "assisted",
    "id": "0010",
    "imageAssetId": "0010",
    "instructions": [
      "Hang from a pull-up bar with your arms fully extended and your palms facing away from you.",
      "Engage your core and lift your knees towards your chest, keeping your legs together.",
      "Once your knees are at chest level, explosively throw your legs down towards the ground, extending them fully.",
      "Allow your legs to swing back up and repeat the movement for the desired number of repetitions."
    ],
    "name": "Assisted Hanging Knee Raise With Throw Down",
    "secondaryMuscles": [
      "Hip Flexors",
      "Lower Back"
    ],
    "target": "Abs"
  },
  {
    "bodyPart": "waist",
    "category": "strength",
    "description": "The assisted lying leg raise with lateral throw down is an abdominal exercise that targets the abs while also engaging the hip flexors and obliques. The movement involves lifting the legs while lying on your back, then lowering them to each side in a controlled manner, which challenges core stability and strength.",
    "difficulty": "intermediate",
    "equipment": "assisted",
    "id": "0012",
    "imageAssetId": "0012",
    "instructions": [
      "Lie flat on your back with your legs extended and your arms by your sides.",
      "Place your hands under your glutes for support.",
      "Engage your abs and lift your legs off the ground, keeping them straight.",
      "While keeping your legs together, lower them to one side until they are a few inches above the ground.",
      "Pause for a moment, then lift your legs back to the starting position.",
      "Repeat the movement to the other side.",
      "Continue alternating sides for the desired number of repetitions."
    ],
    "name": "Assisted Lying Leg Raise With Lateral Throw Down",
    "secondaryMuscles": [
      "Hip Flexors",
      "Obliques"
    ],
    "target": "Abs"
  },
  {
    "bodyPart": "waist",
    "category": "strength",
    "description": "The assisted lying leg raise with throw down is an abdominal exercise that targets the abs while also engaging the hip flexors and quadriceps. The movement involves raising the legs while lying on your back, then forcefully lowering them (throwing them down) and raising them again, often with a partner providing resistance or assistance.",
    "difficulty": "intermediate",
    "equipment": "assisted",
    "id": "0013",
    "imageAssetId": "0013",
    "instructions": [
      "Lie flat on your back with your legs extended and your arms by your sides.",
      "Place your hands under your glutes for support.",
      "Engage your core and lift your legs off the ground, keeping them straight.",
      "Raise your legs until they are perpendicular to the ground.",
      "Lower your legs back down to the starting position.",
      "Simultaneously, throw your legs down towards the ground, keeping them straight.",
      "Raise your legs back up to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Assisted Lying Leg Raise With Throw Down",
    "secondaryMuscles": [
      "Hip Flexors",
      "Quadriceps"
    ],
    "target": "Abs"
  },
  {
    "bodyPart": "waist",
    "category": "strength",
    "description": "The assisted motion Russian twist is a core exercise performed with a medicine ball. It targets the abdominal muscles and also engages the obliques and lower back. The movement involves twisting the torso from side to side while holding a medicine ball, which adds resistance and helps build core strength and stability.",
    "difficulty": "beginner",
    "equipment": "medicine ball",
    "id": "0014",
    "imageAssetId": "0014",
    "instructions": [
      "Sit on the ground with your knees bent and feet flat on the floor.",
      "Hold the medicine ball with both hands in front of your chest.",
      "Lean back slightly, engaging your abs and keeping your back straight.",
      "Slowly twist your torso to the right, bringing the medicine ball towards the right side of your body.",
      "Pause for a moment, then twist your torso to the left, bringing the medicine ball towards the left side of your body.",
      "Continue alternating sides for the desired number of repetitions."
    ],
    "name": "Assisted Motion Russian Twist",
    "secondaryMuscles": [
      "Obliques",
      "Lower Back"
    ],
    "target": "Abs"
  },
  {
    "bodyPart": "back",
    "category": "strength",
    "description": "The assisted parallel close grip pull-up is a back exercise performed on a leverage machine that helps users perform pull-ups with added support, making it easier to complete the movement and focus on form.",
    "difficulty": "beginner",
    "equipment": "leverage machine",
    "id": "0015",
    "imageAssetId": "0015",
    "instructions": [
      "Adjust the machine to your desired weight and height.",
      "Place your hands on the parallel bars with a close grip, palms facing each other.",
      "Hang from the bars with your arms fully extended and your feet off the ground.",
      "Engage your back muscles and pull your body up towards the bars, keeping your elbows close to your body.",
      "Continue pulling until your chin is above the bars.",
      "Pause for a moment at the top, then slowly lower your body back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Assisted Parallel Close Grip Pull-up",
    "secondaryMuscles": [
      "Biceps",
      "Forearms"
    ],
    "target": "Lats"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The assisted prone hamstring exercise targets the hamstrings with assistance from a partner or resistance band, making it accessible for those developing strength or needing support. It involves lying face down and curling the legs towards the glutes, focusing on hamstring engagement.",
    "difficulty": "beginner",
    "equipment": "assisted",
    "id": "0016",
    "imageAssetId": "0016",
    "instructions": [
      "Lie face down on a mat or bench with your legs fully extended.",
      "Have a partner or use a resistance band to secure your ankles.",
      "Engage your hamstrings and lift your legs towards your glutes, keeping your knees straight.",
      "Pause for a moment at the top, then slowly lower your legs back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Assisted Prone Hamstring",
    "secondaryMuscles": [
      "Glutes",
      "Lower Back"
    ],
    "target": "Hamstrings"
  },
  {
    "bodyPart": "back",
    "category": "strength",
    "description": "The assisted pull-up is a machine-based exercise that helps users perform pull-ups with added support, making it easier to lift their body weight. It primarily targets the latissimus dorsi (lats) and also engages the biceps and forearms.",
    "difficulty": "beginner",
    "equipment": "leverage machine",
    "id": "0017",
    "imageAssetId": "0017",
    "instructions": [
      "Adjust the machine to your desired weight and height settings.",
      "Grasp the handles with an overhand grip, slightly wider than shoulder-width apart.",
      "Hang with your arms fully extended and your feet off the ground.",
      "Engage your back muscles and pull your body up towards the handles, keeping your elbows close to your body.",
      "Continue pulling until your chin is above the handles.",
      "Pause for a moment at the top, then slowly lower your body back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Assisted Pull-up",
    "secondaryMuscles": [
      "Biceps",
      "Forearms"
    ],
    "target": "Lats"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The assisted standing triceps extension (with towel) is an exercise targeting the triceps using a towel for assistance. It is performed standing, with the towel held behind the head, extending the arms upward to work the triceps.",
    "difficulty": "beginner",
    "equipment": "assisted (towel)",
    "id": "0018",
    "imageAssetId": "0018",
    "instructions": [
      "Stand with your feet shoulder-width apart and hold a towel with both hands behind your head.",
      "Keep your elbows close to your ears and your upper arms stationary.",
      "Slowly extend your forearms upward, squeezing your triceps at the top.",
      "Pause for a moment, then slowly lower the towel back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Assisted Standing Triceps Extension (with Towel)",
    "secondaryMuscles": [
      "Shoulders"
    ],
    "target": "Triceps"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The assisted triceps dip (kneeling) is performed on a leverage machine, allowing users to target the triceps with support, making the exercise accessible for those who may not yet have the strength for unassisted dips. It also engages the chest and shoulders as secondary muscles.",
    "difficulty": "beginner",
    "equipment": "leverage machine",
    "id": "0019",
    "imageAssetId": "0019",
    "instructions": [
      "Adjust the machine to your desired weight and height.",
      "Kneel down on the pad facing the machine, with your hands gripping the handles.",
      "Lower your body by bending your elbows, keeping your back straight and close to the machine.",
      "Pause for a moment at the bottom, then push yourself back up to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Assisted Triceps Dip (kneeling)",
    "secondaryMuscles": [
      "Chest",
      "Shoulders"
    ],
    "target": "Triceps"
  },
  {
    "bodyPart": "cardio",
    "category": "cardio",
    "description": "Astride jumps (male) are a plyometric cardio exercise that involves jumping explosively from a squat position, spreading the legs and arms in the air, and landing softly. This movement targets the cardiovascular system while also engaging the quadriceps, hamstrings, and calves.",
    "difficulty": "beginner",
    "equipment": "body weight",
    "id": "3220",
    "imageAssetId": "3220",
    "instructions": [
      "Stand with your feet shoulder-width apart.",
      "Bend your knees and lower your body into a squat position.",
      "Jump explosively upwards, extending your legs and arms.",
      "While in the air, spread your legs apart and bring your arms out to the sides.",
      "Land softly with your feet shoulder-width apart, bending your knees to absorb the impact.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Astride Jumps (male)",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Calves"
    ],
    "target": "Cardiovascular System"
  },
  {
    "bodyPart": "upper legs",
    "category": "balance",
    "description": "The balance board exercise involves standing on a balance board with one foot, engaging the core and lower body muscles to maintain stability and balance. This exercise primarily targets the quads, while also engaging the calves, hamstrings, and glutes as secondary muscles.",
    "difficulty": "intermediate",
    "equipment": "body weight",
    "id": "0020",
    "imageAssetId": "0020",
    "instructions": [
      "Place the balance board on a flat surface.",
      "Step onto the balance board with one foot, ensuring it is centered.",
      "Slowly shift your weight onto the foot on the balance board, keeping your core engaged.",
      "Maintain your balance and stability as you hold the position for a desired amount of time.",
      "Repeat the exercise with the other foot."
    ],
    "name": "Balance Board",
    "secondaryMuscles": [
      "Calves",
      "Hamstrings",
      "Glutes"
    ],
    "target": "Quads"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The band one arm single leg split squat is a lower body exercise that targets the quadriceps, with secondary emphasis on the glutes and hamstrings. It involves performing a split squat on one leg with the rear foot elevated and a resistance band around the ankles, challenging balance and unilateral strength.",
    "difficulty": "intermediate",
    "equipment": "band",
    "id": "0987",
    "imageAssetId": "0987",
    "instructions": [
      "Stand with your feet hip-width apart and place a resistance band around your ankles.",
      "Extend one leg forward and rest the top of your foot on a bench or step behind you.",
      "Hold onto a support with one hand for balance.",
      "Bend your standing leg and lower your body down into a squat position, keeping your knee in line with your toes.",
      "Push through your heel to return to the starting position.",
      "Repeat for the desired number of repetitions, then switch legs."
    ],
    "name": "Band One Arm Single Leg Split Squat",
    "secondaryMuscles": [
      "Glutes",
      "Hamstrings"
    ],
    "target": "Quads"
  },
  {
    "bodyPart": "lower legs",
    "category": "strength",
    "description": "The band single leg calf raise is a lower leg exercise that targets the calves using a resistance band. It also engages the ankles and feet, helping to improve strength and stability in the lower leg. The movement is performed one leg at a time, which increases the balance and coordination required.",
    "difficulty": "intermediate",
    "equipment": "band",
    "id": "0999",
    "imageAssetId": "0999",
    "instructions": [
      "Stand with your feet hip-width apart and place the band around the ball of your left foot.",
      "Hold onto a stable object for balance if needed.",
      "Slowly raise your left heel off the ground, lifting your body weight onto the ball of your foot.",
      "Pause for a moment at the top, then slowly lower your left heel back down to the starting position.",
      "Repeat for the desired number of repetitions, then switch to the right leg."
    ],
    "name": "Band Single Leg Calf Raise",
    "secondaryMuscles": [
      "Ankles",
      "Feet"
    ],
    "target": "Calves"
  },
  {
    "bodyPart": "lower legs",
    "category": "strength",
    "description": "The band single leg reverse calf raise is a lower leg exercise that targets the calves, with secondary emphasis on the hamstrings and glutes. It uses a resistance band and requires balance and control as you raise your heel off the ground on one leg.",
    "difficulty": "intermediate",
    "equipment": "band",
    "id": "1000",
    "imageAssetId": "1000",
    "instructions": [
      "Stand with your feet hip-width apart and place the band around the ball of your foot.",
      "Hold onto a stable object for balance.",
      "Slowly raise your heel off the ground, lifting your body weight onto the ball of your foot.",
      "Pause for a moment at the top, then slowly lower your heel back down to the starting position.",
      "Repeat for the desired number of repetitions, then switch to the other leg."
    ],
    "name": "Band Single Leg Reverse Calf Raise",
    "secondaryMuscles": [
      "Hamstrings",
      "Glutes"
    ],
    "target": "Calves"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The band single leg split squat is a lower body exercise targeting the quads, with secondary emphasis on the glutes and hamstrings. It uses a resistance band for added tension and requires balance and coordination.",
    "difficulty": "intermediate",
    "equipment": "band",
    "id": "1001",
    "imageAssetId": "1001",
    "instructions": [
      "Stand with your feet hip-width apart and place a resistance band around your ankles.",
      "Take a big step forward with your right foot and a smaller step back with your left foot.",
      "Bend your knees and lower your body until your right thigh is parallel to the ground, keeping your left knee slightly above the ground.",
      "Push through your right heel to return to the starting position.",
      "Repeat on the other side."
    ],
    "name": "Band Single Leg Split Squat",
    "secondaryMuscles": [
      "Glutes",
      "Hamstrings"
    ],
    "target": "Quads"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The band standing rear delt row is an exercise targeting the rear deltoids, with secondary emphasis on the trapezius, rhomboids, and biceps. It uses a resistance band and involves pulling the band towards the chest while hinging at the hips, focusing on squeezing the shoulder blades together.",
    "difficulty": "beginner",
    "equipment": "band",
    "id": "1022",
    "imageAssetId": "1022",
    "instructions": [
      "Stand with your feet shoulder-width apart and place the band under your feet.",
      "Hold the band handles with your palms facing each other and your arms extended in front of you.",
      "Bend your knees slightly and hinge forward at the hips, keeping your back straight.",
      "Pull the band towards your chest, squeezing your shoulder blades together.",
      "Pause for a moment at the top, then slowly release the tension and return to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Band Standing Rear Delt Row",
    "secondaryMuscles": [
      "Trapezius",
      "Rhomboids",
      "Biceps"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The barbell alternate biceps curl is a strength exercise targeting the biceps, performed by alternately curling a barbell with each arm while standing. It also engages the forearms as secondary muscles.",
    "difficulty": "beginner",
    "equipment": "barbell",
    "id": "0023",
    "imageAssetId": "0023",
    "instructions": [
      "Stand up straight with your feet shoulder-width apart and hold a barbell in each hand, palms facing forward.",
      "Keep your upper arms stationary and exhale as you curl the weights while contracting your biceps.",
      "Continue to raise the barbells until your biceps are fully contracted and the barbells are at shoulder level.",
      "Hold the contracted position for a brief pause as you squeeze your biceps.",
      "Inhale as you slowly begin to lower the barbells back to the starting position.",
      "Repeat for the desired number of repetitions, alternating arms."
    ],
    "name": "Barbell Alternate Biceps Curl",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Biceps"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The barbell bench front squat is a compound lower body exercise that targets the quadriceps, with secondary emphasis on the hamstrings, glutes, and calves. It requires holding a barbell in the front rack position and performing a squat, demanding good core stability, balance, and mobility.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0024",
    "imageAssetId": "0024",
    "instructions": [
      "Start by standing with your feet shoulder-width apart and the barbell resting on your upper chest, just below your collarbone.",
      "Hold the barbell with an overhand grip, keeping your elbows up and your upper arms parallel to the ground.",
      "Lower your body down into a squat position by bending at the knees and hips, keeping your back straight and your chest up.",
      "Pause for a moment at the bottom of the squat, then push through your heels to return to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Bench Front Squat",
    "secondaryMuscles": [
      "Hamstrings",
      "Glutes",
      "Calves"
    ],
    "target": "Quads"
  },
  {
    "bodyPart": "chest",
    "category": "strength",
    "description": "The barbell bench press is a classic compound exercise that primarily targets the pectoral muscles, while also engaging the triceps and shoulders. It is performed by lying on a bench and pressing a barbell up and down in a controlled manner.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0025",
    "imageAssetId": "0025",
    "instructions": [
      "Lie flat on a bench with your feet flat on the ground and your back pressed against the bench.",
      "Grasp the barbell with an overhand grip slightly wider than shoulder-width apart.",
      "Lift the barbell off the rack and hold it directly above your chest with your arms fully extended.",
      "Lower the barbell slowly towards your chest, keeping your elbows tucked in.",
      "Pause for a moment when the barbell touches your chest.",
      "Push the barbell back up to the starting position by extending your arms.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Bench Press",
    "secondaryMuscles": [
      "Triceps",
      "Shoulders"
    ],
    "target": "Pectorals"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The barbell bench squat is a compound lower body exercise that primarily targets the quadriceps, while also engaging the glutes, hamstrings, and calves. It involves squatting with a barbell, requiring good technique and strength.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0026",
    "imageAssetId": "0026",
    "instructions": [
      "Set up a barbell on a squat rack at chest height.",
      "Stand facing away from the rack, with your feet shoulder-width apart.",
      "Bend your knees and lower your body down into a squat position, keeping your back straight and chest up.",
      "Grasp the barbell with an overhand grip, slightly wider than shoulder-width apart.",
      "Lift the barbell off the rack and step back, ensuring your feet are still shoulder-width apart.",
      "Lower your body down into a squat, keeping your knees in line with your toes.",
      "Pause for a moment at the bottom, then push through your heels to return to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Bench Squat",
    "secondaryMuscles": [
      "Glutes",
      "Hamstrings",
      "Calves"
    ],
    "target": "Quads"
  },
  {
    "bodyPart": "back",
    "category": "strength",
    "description": "The barbell bent over row is a compound exercise targeting the upper back, requiring the lifter to hinge at the hips and pull a barbell towards the torso. It develops strength and muscle mass in the upper back, biceps, and forearms, and demands good posture and core stability.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0027",
    "imageAssetId": "0027",
    "instructions": [
      "Stand with your feet shoulder-width apart and knees slightly bent.",
      "Bend forward at the hips while keeping your back straight and chest up.",
      "Grasp the barbell with an overhand grip, hands slightly wider than shoulder-width apart.",
      "Pull the barbell towards your lower chest by retracting your shoulder blades and squeezing your back muscles.",
      "Pause for a moment at the top, then slowly lower the barbell back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Bent Over Row",
    "secondaryMuscles": [
      "Biceps",
      "Forearms"
    ],
    "target": "Upper Back"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The barbell clean and press is a compound exercise that targets the quads and involves lifting a barbell from the floor to the shoulders (clean) and then pressing it overhead (press). It requires strength, coordination, and explosive power.",
    "difficulty": "advanced",
    "equipment": "barbell",
    "id": "0028",
    "imageAssetId": "0028",
    "instructions": [
      "Stand with your feet shoulder-width apart and the barbell on the floor in front of you.",
      "Bend your knees and hinge at the hips to lower down and grip the barbell with an overhand grip, hands slightly wider than shoulder-width apart.",
      "Drive through your heels and extend your hips and knees to lift the barbell off the floor, keeping it close to your body.",
      "As the barbell reaches your thighs, explosively extend your hips, shrug your shoulders, and pull the barbell up towards your chest.",
      "As the barbell reaches chest height, quickly drop under it and catch it at shoulder level, with your elbows pointing forward and your palms facing up.",
      "From the catch position, press the barbell overhead by extending your arms and pushing the barbell straight up.",
      "Lower the barbell back down to the starting position and repeat for the desired number of repetitions."
    ],
    "name": "Barbell Clean And Press",
    "secondaryMuscles": [
      "Hamstrings",
      "Glutes",
      "Shoulders",
      "Triceps"
    ],
    "target": "Quads"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The barbell clean-grip front squat is a compound lower body exercise that targets the glutes, quadriceps, and hamstrings, while also engaging the core for stability. It requires holding a barbell in the clean grip position on the front of the shoulders, demanding good mobility and strength.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0029",
    "imageAssetId": "0029",
    "instructions": [
      "Start by standing with your feet shoulder-width apart and the barbell resting on your upper chest, with your elbows pointing forward.",
      "Lower your body by bending your knees and pushing your hips back, as if you are sitting back into a chair.",
      "Keep your chest up and your back straight as you lower down, making sure your knees do not go past your toes.",
      "Continue lowering until your thighs are parallel to the ground, or as low as you can comfortably go.",
      "Pause for a moment at the bottom, then push through your heels to stand back up, extending your hips and knees.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Clean-grip Front Squat",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Calves",
      "Core"
    ],
    "target": "Glutes"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The barbell close-grip bench press is a compound exercise primarily targeting the triceps, with secondary emphasis on the chest and shoulders. It is performed by lying on a bench, gripping the barbell with a close grip, and pressing the weight up and down while keeping the elbows close to the body.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0030",
    "imageAssetId": "0030",
    "instructions": [
      "Lie flat on a bench with your feet flat on the ground and your back pressed against the bench.",
      "Grasp the barbell with a close grip, slightly narrower than shoulder-width apart.",
      "Unrack the barbell and lower it slowly towards your chest, keeping your elbows close to your body.",
      "Pause for a moment when the barbell touches your chest.",
      "Push the barbell back up to the starting position, fully extending your arms.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Close-grip Bench Press",
    "secondaryMuscles": [
      "Chest",
      "Shoulders"
    ],
    "target": "Triceps"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The barbell curl is a classic strength exercise targeting the biceps, performed by curling a barbell from the thighs to the shoulders while keeping the elbows close to the torso.",
    "difficulty": "beginner",
    "equipment": "barbell",
    "id": "0031",
    "imageAssetId": "0031",
    "instructions": [
      "Stand up straight with your feet shoulder-width apart and hold a barbell with an underhand grip, palms facing forward.",
      "Keep your elbows close to your torso and exhale as you curl the weights while contracting your biceps.",
      "Continue to raise the bar until your biceps are fully contracted and the bar is at shoulder level.",
      "Hold the contracted position for a brief pause as you squeeze your biceps.",
      "Inhale as you slowly begin to lower the bar back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Curl",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Biceps"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The barbell deadlift is a compound strength exercise that targets the glutes, hamstrings, and lower back. It involves lifting a loaded barbell from the ground to a standing position, emphasizing proper form and core engagement.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0032",
    "imageAssetId": "0032",
    "instructions": [
      "Stand with your feet shoulder-width apart and the barbell on the ground in front of you.",
      "Bend your knees and hinge at the hips to lower your torso and grip the barbell with an overhand grip, hands slightly wider than shoulder-width apart.",
      "Keep your back straight and chest lifted as you drive through your heels to lift the barbell off the ground, extending your hips and knees.",
      "As you stand up straight, squeeze your glutes and keep your core engaged.",
      "Lower the barbell back down to the ground by bending at the hips and knees, keeping your back straight.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Deadlift",
    "secondaryMuscles": [
      "Hamstrings",
      "Lower Back"
    ],
    "target": "Glutes"
  },
  {
    "bodyPart": "chest",
    "category": "strength",
    "description": "The barbell decline bench press is a compound exercise targeting the lower portion of the pectoral muscles. It is performed on a decline bench, requiring the lifter to press a barbell upward from a declined position, engaging the chest, triceps, and shoulders.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0033",
    "imageAssetId": "0033",
    "instructions": [
      "Lie on a decline bench with your feet secured and your head lower than your hips.",
      "Grasp the barbell with an overhand grip slightly wider than shoulder-width apart.",
      "Unrack the barbell and lower it slowly towards your chest, keeping your elbows tucked in.",
      "Pause for a moment at the bottom, then push the barbell back up to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Decline Bench Press",
    "secondaryMuscles": [
      "Triceps",
      "Shoulders"
    ],
    "target": "Pectorals"
  },
  {
    "bodyPart": "back",
    "category": "strength",
    "description": "The barbell decline bent arm pullover is a compound exercise primarily targeting the lats, performed on a decline bench with a barbell. It also engages the triceps and chest as secondary muscles. The movement requires good control and strength to safely lower and lift the barbell over the head while maintaining proper form.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0034",
    "imageAssetId": "0034",
    "instructions": [
      "Lie down on a decline bench with your head lower than your hips and your feet secured.",
      "Hold a barbell with a pronated grip (palms facing away from you) and extend your arms straight above your chest.",
      "Lower the barbell behind your head in a controlled manner, keeping your arms slightly bent.",
      "Pause for a moment, then raise the barbell back to the starting position by contracting your lats.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Decline Bent Arm Pullover",
    "secondaryMuscles": [
      "Triceps",
      "Chest"
    ],
    "target": "Lats"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The barbell decline close grip to skull press is a compound exercise targeting the triceps, performed on a decline bench with a close grip on the barbell. It combines elements of a close grip press and a skull crusher, challenging both triceps strength and stability.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0035",
    "imageAssetId": "0035",
    "instructions": [
      "Lie on a decline bench with your head lower than your feet and hold a barbell with a close grip.",
      "Lower the barbell towards your forehead by bending your elbows, keeping your upper arms stationary.",
      "Pause for a moment, then extend your arms to press the barbell back up to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Decline Close Grip To Skull Press",
    "secondaryMuscles": [
      "Chest",
      "Shoulders"
    ],
    "target": "Triceps"
  },
  {
    "bodyPart": "chest",
    "category": "strength",
    "description": "The barbell decline wide-grip press is a compound chest exercise performed on a decline bench using a barbell with a wide grip. It targets the lower portion of the pectoral muscles and also engages the triceps and shoulders.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0036",
    "imageAssetId": "0036",
    "instructions": [
      "Lie on a decline bench with your feet secured and your head lower than your hips.",
      "Grasp the barbell with a wide grip, slightly wider than shoulder-width apart.",
      "Lower the barbell to your chest, keeping your elbows out to the sides.",
      "Push the barbell back up to the starting position, fully extending your arms.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Decline Wide-grip Press",
    "secondaryMuscles": [
      "Triceps",
      "Shoulders"
    ],
    "target": "Pectorals"
  },
  {
    "bodyPart": "back",
    "category": "strength",
    "description": "The barbell decline wide-grip pullover is a compound exercise performed on a decline bench, targeting the lats while also engaging the triceps and chest. It requires a barbell and involves lowering the weight behind the head with straight arms, then returning to the starting position.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0037",
    "imageAssetId": "0037",
    "instructions": [
      "Lie on a decline bench with your head lower than your hips and your feet secured.",
      "Hold a barbell with a wide grip and extend your arms straight above your chest.",
      "Lower the barbell behind your head in a controlled manner, keeping your arms straight.",
      "Pause for a moment, then raise the barbell back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Decline Wide-grip Pullover",
    "secondaryMuscles": [
      "Triceps",
      "Chest"
    ],
    "target": "Lats"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The barbell drag curl is a biceps-focused exercise that involves curling a barbell while keeping the elbows pulled back, emphasizing the contraction of the biceps and minimizing shoulder involvement. It also engages the forearms as secondary muscles.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0038",
    "imageAssetId": "0038",
    "instructions": [
      "Stand with your feet shoulder-width apart and hold a barbell with an underhand grip, palms facing up.",
      "Let the barbell hang at arm's length in front of your thighs.",
      "Keeping your upper arms stationary, curl the barbell up towards your chest by contracting your biceps.",
      "Pause for a moment at the top, then slowly lower the barbell back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Drag Curl",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Biceps"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The barbell front chest squat is a compound lower body exercise that targets the glutes and also works the quadriceps, hamstrings, calves, and core. It involves holding a barbell at the front of the chest and performing a squat, which requires strength, balance, and proper technique.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0039",
    "imageAssetId": "0039",
    "instructions": [
      "Start by standing with your feet shoulder-width apart, toes slightly turned out.",
      "Hold the barbell in front of your chest with your hands shoulder-width apart, elbows pointing forward.",
      "Engage your core and keep your chest up as you lower your body down into a squat position, pushing your hips back and bending your knees.",
      "Lower until your thighs are parallel to the ground, or as low as you can comfortably go.",
      "Pause for a moment at the bottom, then push through your heels to return to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Front Chest Squat",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Calves",
      "Core"
    ],
    "target": "Glutes"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The barbell front raise is a shoulder exercise that targets the deltoids by lifting a barbell from the thighs to shoulder height with straight arms.",
    "difficulty": "beginner",
    "equipment": "barbell",
    "id": "0041",
    "imageAssetId": "0041",
    "instructions": [
      "Stand with your feet shoulder-width apart and hold a barbell in front of your thighs with an overhand grip.",
      "Keep your arms straight and lift the barbell forward and upward until it reaches shoulder level.",
      "Pause for a moment at the top, then slowly lower the barbell back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Front Raise",
    "secondaryMuscles": [
      "Biceps",
      "Triceps"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "chest",
    "category": "strength",
    "description": "The barbell front raise and pullover is a compound exercise targeting the pectorals, with secondary emphasis on the deltoids and triceps. It involves raising a barbell in front of the body and then performing a pullover motion behind the head, requiring strength, coordination, and shoulder mobility.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0040",
    "imageAssetId": "0040",
    "instructions": [
      "Stand with your feet shoulder-width apart and hold a barbell with an overhand grip, palms facing down.",
      "Keep your arms straight and raise the barbell in front of you until it reaches shoulder height.",
      "Pause for a moment at the top, then slowly lower the barbell back down to the starting position.",
      "Next, lower the barbell behind your head, keeping your arms straight.",
      "Pause for a moment at the bottom, then raise the barbell back up to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Front Raise And Pullover",
    "secondaryMuscles": [
      "Deltoids",
      "Triceps"
    ],
    "target": "Pectorals"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The barbell front squat is a compound lower body exercise that targets the glutes, quadriceps, and hamstrings, while also engaging the core for stability. The barbell is held in front of the shoulders, requiring good mobility and core strength to maintain proper posture throughout the movement.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0042",
    "imageAssetId": "0042",
    "instructions": [
      "Start by standing with your feet shoulder-width apart, toes slightly turned out.",
      "Hold the barbell in front of your shoulders, resting it on your collarbone and shoulders.",
      "Engage your core and keep your chest up as you lower your body down into a squat position, pushing your hips back and bending your knees.",
      "Lower until your thighs are parallel to the ground, or as low as you can comfortably go.",
      "Pause for a moment at the bottom, then push through your heels to return to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Front Squat",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Calves",
      "Core"
    ],
    "target": "Glutes"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The barbell full squat is a compound lower body exercise that targets the glutes and also works the quadriceps, hamstrings, calves, and core. It involves squatting down with a barbell placed across the upper back, requiring strength, balance, and proper technique.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0043",
    "imageAssetId": "0043",
    "instructions": [
      "Stand with your feet shoulder-width apart, toes slightly turned out.",
      "Hold the barbell across your upper back, resting it on your traps or rear delts.",
      "Engage your core and keep your chest up as you begin to lower your body down.",
      "Bend at the knees and hips, pushing your hips back and down as if sitting into a chair.",
      "Lower yourself until your thighs are parallel to the ground or slightly below.",
      "Keep your knees in line with your toes and your weight in your heels.",
      "Drive through your heels to stand back up, extending your hips and knees.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Full Squat",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Calves",
      "Core"
    ],
    "target": "Glutes"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The barbell good morning is a compound exercise that targets the hamstrings and lower back. It involves hinging at the hips with a barbell on your upper back, requiring good form and core stability to perform safely.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0044",
    "imageAssetId": "0044",
    "instructions": [
      "Start by standing with your feet shoulder-width apart and the barbell resting on your upper back.",
      "Keeping your back straight and your core engaged, hinge forward at the hips, pushing your buttocks back as if you were trying to touch the wall behind you with your glutes.",
      "Lower your torso until it is parallel to the ground, feeling a stretch in your hamstrings.",
      "Pause for a moment, then return to the starting position by squeezing your glutes and pushing your hips forward.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Good Morning",
    "secondaryMuscles": [
      "Lower Back"
    ],
    "target": "Hamstrings"
  },
  {
    "bodyPart": "chest",
    "category": "strength",
    "description": "The barbell guillotine bench press is a variation of the bench press where the bar is lowered to the neck instead of the chest, placing greater emphasis on the upper pectorals. This exercise requires careful control and proper technique to avoid injury.",
    "difficulty": "advanced",
    "equipment": "barbell",
    "id": "0045",
    "imageAssetId": "0045",
    "instructions": [
      "Lie flat on a bench with your feet flat on the ground and your back pressed against the bench.",
      "Grasp the barbell with an overhand grip, slightly wider than shoulder-width apart.",
      "Lower the barbell slowly towards your neck, keeping your elbows pointed outwards.",
      "Pause for a moment when the barbell is just above your neck.",
      "Push the barbell back up to the starting position, fully extending your arms.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Guillotine Bench Press",
    "secondaryMuscles": [
      "Shoulders",
      "Triceps"
    ],
    "target": "Pectorals"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The barbell hack squat is a lower body strength exercise that targets the glutes, quadriceps, hamstrings, and calves. It involves holding a barbell behind the legs and performing a squat motion, emphasizing the posterior chain and quadriceps.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0046",
    "imageAssetId": "0046",
    "instructions": [
      "Start by standing with your feet shoulder-width apart and your toes slightly turned out.",
      "Hold the barbell behind your legs, resting it on your upper thighs.",
      "Lower your body by bending at the knees and hips, keeping your back straight and your chest up.",
      "Continue lowering until your thighs are parallel to the ground, or as low as you can comfortably go.",
      "Pause for a moment, then push through your heels to return to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Hack Squat",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Calves"
    ],
    "target": "Glutes"
  },
  {
    "bodyPart": "chest",
    "category": "strength",
    "description": "The barbell incline bench press is a compound upper-body exercise that targets the upper portion of the pectoral muscles, with secondary emphasis on the shoulders and triceps. It is performed on an incline bench using a barbell, making it a staple in strength training routines for developing chest size and strength.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0047",
    "imageAssetId": "0047",
    "instructions": [
      "Set up an incline bench at a 45-degree angle.",
      "Lie down on the bench with your feet flat on the ground.",
      "Grasp the barbell with an overhand grip, slightly wider than shoulder-width apart.",
      "Unrack the barbell and lower it slowly towards your chest, keeping your elbows at a 45-degree angle.",
      "Pause for a moment at the bottom, then push the barbell back up to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Incline Bench Press",
    "secondaryMuscles": [
      "Shoulders",
      "Triceps"
    ],
    "target": "Pectorals"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The barbell incline reverse-grip press is a compound upper body exercise that targets the triceps while also engaging the chest and shoulders. It is performed on an incline bench using a reverse (underhand) grip on the barbell.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0048",
    "imageAssetId": "0048",
    "instructions": [
      "Set up an incline bench at a 45-degree angle.",
      "Lie back on the bench and grasp the barbell with a reverse grip, hands slightly wider than shoulder-width apart.",
      "Unrack the barbell and lower it towards your upper chest, keeping your elbows tucked in.",
      "Pause for a moment at the bottom, then push the barbell back up to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Incline Reverse-grip Press",
    "secondaryMuscles": [
      "Chest",
      "Shoulders"
    ],
    "target": "Triceps"
  },
  {
    "bodyPart": "back",
    "category": "strength",
    "description": "The barbell incline row is a compound exercise targeting the upper back, performed while lying face down on an incline bench and pulling a barbell towards the chest.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0049",
    "imageAssetId": "0049",
    "instructions": [
      "Set up an incline bench at a 45-degree angle.",
      "Lie face down on the bench with your chest against the pad and your feet flat on the ground.",
      "Grasp the barbell with an overhand grip, slightly wider than shoulder-width apart.",
      "Keep your back straight and your core engaged.",
      "Pull the barbell towards your chest, squeezing your shoulder blades together.",
      "Pause for a moment at the top, then slowly lower the barbell back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Incline Row",
    "secondaryMuscles": [
      "Biceps",
      "Forearms"
    ],
    "target": "Upper Back"
  },
  {
    "bodyPart": "chest",
    "category": "strength",
    "description": "The barbell incline shoulder raise is performed on an incline bench and targets the serratus anterior, with secondary emphasis on the deltoids and trapezius. The movement involves raising a barbell overhead from shoulder height while seated on an incline bench.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0050",
    "imageAssetId": "0050",
    "instructions": [
      "Set up an incline bench at a 45-degree angle.",
      "Sit on the bench with your back against the pad and feet flat on the ground.",
      "Hold a barbell with an overhand grip, slightly wider than shoulder-width apart.",
      "Lift the barbell up to shoulder height, keeping your elbows slightly bent.",
      "Slowly raise the barbell overhead, extending your arms fully.",
      "Pause for a moment at the top, then slowly lower the barbell back to shoulder height.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Incline Shoulder Raise",
    "secondaryMuscles": [
      "Deltoids",
      "Trapezius"
    ],
    "target": "Serratus Anterior"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The barbell Jefferson squat is a compound lower body exercise that targets the glutes, quadriceps, hamstrings, and calves. It involves holding a barbell between the legs and performing a squat with a staggered stance, alternating foot positions with each repetition.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0051",
    "imageAssetId": "0051",
    "instructions": [
      "Stand with your feet shoulder-width apart and toes slightly turned out.",
      "Hold the barbell with an overhand grip, resting it on the front of your body, just below your waist.",
      "Step your left foot forward and your right foot back, keeping your feet shoulder-width apart.",
      "Bend your knees and lower your body down into a squat position, keeping your back straight and chest up.",
      "Push through your heels to stand back up to the starting position.",
      "Repeat the movement, alternating your forward and back foot with each repetition."
    ],
    "name": "Barbell Jefferson Squat",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Calves"
    ],
    "target": "Glutes"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The barbell JM bench press is a triceps-focused pressing movement that combines elements of a close-grip bench press and a triceps extension. It is performed lying on a bench, lowering the barbell to the chest with elbows tucked, and pressing back up.",
    "difficulty": "advanced",
    "equipment": "barbell",
    "id": "0052",
    "imageAssetId": "0052",
    "instructions": [
      "Lie flat on a bench with your feet flat on the ground and your back pressed against the bench.",
      "Grasp the barbell with an overhand grip, slightly wider than shoulder-width apart.",
      "Lower the barbell to your chest, keeping your elbows tucked in close to your body.",
      "Push the barbell back up to the starting position, fully extending your arms.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Jm Bench Press",
    "secondaryMuscles": [
      "Chest",
      "Shoulders"
    ],
    "target": "Triceps"
  },
  {
    "bodyPart": "upper legs",
    "category": "plyometrics",
    "description": "The barbell jump squat is a dynamic lower body exercise that combines the traditional squat with an explosive jump, performed while holding a barbell across the upper back. This exercise targets the glutes and also works the quadriceps, hamstrings, and calves. It is a plyometric movement that develops power, strength, and explosiveness in the legs.",
    "difficulty": "advanced",
    "equipment": "barbell",
    "id": "0053",
    "imageAssetId": "0053",
    "instructions": [
      "Start by standing with your feet shoulder-width apart, holding a barbell across your upper back.",
      "Lower your body into a squat position by bending your knees and pushing your hips back.",
      "Once you reach the bottom of the squat, explode upwards by jumping off the ground.",
      "As you jump, extend your hips, knees, and ankles, pushing through your toes.",
      "Land softly back into the squat position and immediately repeat the movement for the desired number of repetitions."
    ],
    "name": "Barbell Jump Squat",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Calves"
    ],
    "target": "Glutes"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The barbell lunge is a compound lower body exercise that targets the glutes, quadriceps, hamstrings, and calves. It involves stepping forward with a barbell on your upper back and lowering your body into a lunge position before returning to standing.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0054",
    "imageAssetId": "0054",
    "instructions": [
      "Start by standing with your feet shoulder-width apart and a barbell resting on your upper back.",
      "Take a step forward with your right foot, keeping your torso upright.",
      "Lower your body by bending your right knee until your thigh is parallel to the ground.",
      "Push through your right heel to return to the starting position.",
      "Repeat with your left leg, alternating legs for the desired number of repetitions."
    ],
    "name": "Barbell Lunge",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Calves"
    ],
    "target": "Glutes"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The barbell lying close-grip press is a compound upper body exercise that primarily targets the triceps, with secondary emphasis on the chest and shoulders. It is performed lying on a bench, using a close grip on the barbell to increase triceps activation.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0055",
    "imageAssetId": "0055",
    "instructions": [
      "Lie flat on a bench with your feet flat on the ground and your back pressed against the bench.",
      "Grasp the barbell with a close grip, hands shoulder-width apart, palms facing towards your feet.",
      "Lift the barbell off the rack and hold it directly above your chest with your arms fully extended.",
      "Slowly lower the barbell towards your chest, keeping your elbows close to your body.",
      "Pause for a moment when the barbell touches your chest, then push it back up to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Lying Close-grip Press",
    "secondaryMuscles": [
      "Chest",
      "Shoulders"
    ],
    "target": "Triceps"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The barbell lying close-grip triceps extension is a strength exercise targeting the triceps, performed lying on a bench with a barbell using a close grip. It emphasizes triceps development and also engages the shoulders as secondary muscles.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0056",
    "imageAssetId": "0056",
    "instructions": [
      "Lie flat on a bench with your feet flat on the ground and your head at the end of the bench.",
      "Grasp the barbell with a close grip, hands shoulder-width apart, palms facing up.",
      "Extend your arms fully, lifting the barbell above your chest.",
      "Keeping your upper arms stationary, slowly lower the barbell towards your forehead by bending your elbows.",
      "Pause for a moment at the bottom, then extend your arms back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Lying Close-grip Triceps Extension",
    "secondaryMuscles": [
      "Shoulders"
    ],
    "target": "Triceps"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The barbell lying extension, also known as a skullcrusher, is a strength exercise targeting the triceps. It involves lying on a bench and lowering a barbell towards the forehead by bending the elbows, then extending the arms back up.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0057",
    "imageAssetId": "0057",
    "instructions": [
      "Lie flat on a bench with your feet flat on the ground and your head at the end of the bench.",
      "Hold the barbell with an overhand grip, hands shoulder-width apart, and extend your arms straight up over your chest.",
      "Keeping your upper arms stationary, slowly lower the barbell towards your forehead by bending your elbows.",
      "Pause for a moment, then extend your arms back up to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Lying Extension",
    "secondaryMuscles": [
      "Shoulders"
    ],
    "target": "Triceps"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The barbell lying lifting (on hip) exercise primarily targets the glutes and also works the hamstrings and quadriceps. It involves lying on your back on a bench, placing a barbell across your hips, and lifting your hips upward by engaging your glutes.",
    "difficulty": "beginner",
    "equipment": "barbell",
    "id": "0058",
    "imageAssetId": "0058",
    "instructions": [
      "Lie flat on your back on a bench with your feet flat on the ground and your knees bent.",
      "Hold the barbell with an overhand grip and position it on your hips.",
      "Engaging your glutes, lift your hips off the bench until your body forms a straight line from your knees to your shoulders.",
      "Pause for a moment at the top, then slowly lower your hips back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Lying Lifting (on Hip)",
    "secondaryMuscles": [
      "Hamstrings",
      "Quadriceps"
    ],
    "target": "Glutes"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The barbell lying preacher curl is an isolation exercise targeting the biceps, performed on a preacher bench to minimize shoulder involvement and maximize biceps engagement.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0059",
    "imageAssetId": "0059",
    "instructions": [
      "Sit on a preacher bench with your chest against the pad and your arms extended over the edge, holding a barbell with an underhand grip.",
      "Keeping your upper arms stationary, exhale and curl the weights while contracting your biceps.",
      "Continue to raise the bar until your biceps are fully contracted and the bar is at shoulder level.",
      "Hold the contracted position for a brief pause as you squeeze your biceps.",
      "Inhale and slowly begin to lower the barbell back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Lying Preacher Curl",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Biceps"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The barbell lying triceps extension is a strength exercise targeting the triceps, performed by lying on a bench and lowering a barbell towards the forehead before extending the arms back up.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0061",
    "imageAssetId": "0061",
    "instructions": [
      "Lie flat on a bench with your feet flat on the ground and your head at the end of the bench.",
      "Hold the barbell with an overhand grip, hands shoulder-width apart, and extend your arms straight up over your chest.",
      "Keeping your upper arms stationary, slowly lower the barbell towards your forehead by bending your elbows.",
      "Pause for a moment at the bottom, then extend your arms back up to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Lying Triceps Extension",
    "secondaryMuscles": [
      "Shoulders"
    ],
    "target": "Triceps"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The barbell lying triceps extension, also known as the skull crusher, is a strength exercise that targets the triceps. Performed lying on a bench, it involves lowering a barbell to the forehead and extending the arms back up, requiring control and proper form to avoid injury.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0060",
    "imageAssetId": "0060",
    "instructions": [
      "Lie flat on a bench with your feet flat on the ground and your head at the end of the bench.",
      "Hold the barbell with an overhand grip, hands shoulder-width apart, and extend your arms straight up over your chest.",
      "Keeping your upper arms stationary, slowly lower the barbell towards your forehead by bending your elbows.",
      "Pause for a moment when the barbell is just above your forehead, then extend your arms back up to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Lying Triceps Extension Skull Crusher",
    "secondaryMuscles": [
      "Shoulders"
    ],
    "target": "Triceps"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The barbell narrow stance squat is a lower body strength exercise that targets the glutes, with significant involvement of the quadriceps, hamstrings, and calves. It is performed by holding a barbell across the upper back and squatting with a narrow stance, emphasizing the inner thighs and glutes.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0063",
    "imageAssetId": "0063",
    "instructions": [
      "Stand with your feet shoulder-width apart and toes pointing slightly outward.",
      "Hold the barbell across your upper back, resting it on your traps or rear delts.",
      "Engage your core and keep your chest up as you slowly lower your body by bending your knees and pushing your hips back.",
      "Continue lowering until your thighs are parallel to the ground or slightly below.",
      "Pause for a moment, then push through your heels to return to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Narrow Stance Squat",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Calves"
    ],
    "target": "Glutes"
  },
  {
    "bodyPart": "back",
    "category": "strength",
    "description": "The barbell one arm bent over row is a unilateral strength exercise targeting the upper back, requiring balance, coordination, and core stability. It is performed by bending at the hips, keeping the back straight, and rowing a barbell with one arm while maintaining a stable position.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0064",
    "imageAssetId": "0064",
    "instructions": [
      "Stand with your feet shoulder-width apart, knees slightly bent, and hold a barbell with one hand using an overhand grip.",
      "Bend forward at the hips, keeping your back straight and your head in a neutral position.",
      "Pull the barbell up towards your chest, keeping your elbow close to your body and squeezing your shoulder blades together.",
      "Lower the barbell back down to the starting position in a controlled manner.",
      "Repeat for the desired number of repetitions, then switch to the other arm."
    ],
    "name": "Barbell One Arm Bent Over Row",
    "secondaryMuscles": [
      "Biceps",
      "Forearms"
    ],
    "target": "Upper Back"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The barbell one arm floor press is a unilateral pressing exercise that targets the triceps while also engaging the chest and shoulders. It requires the lifter to stabilize the barbell with one arm while lying on the floor, which increases the demand on core stability and coordination.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0065",
    "imageAssetId": "0065",
    "instructions": [
      "Lie flat on your back on the floor with your knees bent and feet flat on the ground.",
      "Hold the barbell with one hand, palm facing up, and extend your arm straight up over your chest.",
      "Slowly lower the barbell towards your chest, keeping your elbow close to your body.",
      "Pause for a moment at the bottom, then push the barbell back up to the starting position.",
      "Repeat for the desired number of repetitions, then switch arms."
    ],
    "name": "Barbell One Arm Floor Press",
    "secondaryMuscles": [
      "Chest",
      "Shoulders"
    ],
    "target": "Triceps"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The barbell one arm side deadlift is a unilateral deadlift variation that targets the glutes, hamstrings, quadriceps, and lower back. It requires holding a barbell in one hand and performing a deadlift motion to the side of the body, challenging balance, grip strength, and core stability.",
    "difficulty": "advanced",
    "equipment": "barbell",
    "id": "0066",
    "imageAssetId": "0066",
    "instructions": [
      "Stand with your feet shoulder-width apart, holding a barbell in one hand with an overhand grip.",
      "Keep your back straight and your core engaged.",
      "Bend at the hips and lower the barbell towards the outside of your leg, keeping your arm straight and your chest up.",
      "Lower the barbell as far as you can while maintaining good form.",
      "Pause for a moment, then slowly return to the starting position.",
      "Repeat for the desired number of repetitions, then switch sides."
    ],
    "name": "Barbell One Arm Side Deadlift",
    "secondaryMuscles": [
      "Hamstrings",
      "Quadriceps",
      "Lower Back"
    ],
    "target": "Glutes"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The barbell one arm snatch is an explosive, full-body movement that targets the shoulders (delts) and also engages the traps, forearms, and core. It requires coordination, balance, and strength to perform safely and effectively.",
    "difficulty": "advanced",
    "equipment": "barbell",
    "id": "0067",
    "imageAssetId": "0067",
    "instructions": [
      "Stand with your feet shoulder-width apart, toes pointing slightly outwards.",
      "Hold the barbell with an overhand grip, hands slightly wider than shoulder-width apart.",
      "Bend your knees and lower your hips into a squat position, keeping your back straight and chest up.",
      "Explosively extend your hips, knees, and ankles, driving the barbell upwards.",
      "As the barbell reaches chest level, pull it upwards with your arm, keeping it close to your body.",
      "Rotate your elbow under the barbell and extend your arm fully overhead, locking out your elbow.",
      "Lower the barbell back down to the starting position in a controlled manner.",
      "Repeat for the desired number of repetitions, then switch arms."
    ],
    "name": "Barbell One Arm Snatch",
    "secondaryMuscles": [
      "Traps",
      "Forearms",
      "Core"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The barbell one leg squat is a challenging lower body exercise that targets the quadriceps while also engaging the glutes, hamstrings, and calves. It requires significant balance, strength, and coordination, as you perform a squat on one leg while holding a barbell across your upper back.",
    "difficulty": "advanced",
    "equipment": "barbell",
    "id": "0068",
    "imageAssetId": "0068",
    "instructions": [
      "Stand with your feet shoulder-width apart and hold a barbell across your upper back.",
      "Lift one foot off the ground and extend it forward, keeping it parallel to the ground.",
      "Bend your standing leg and lower your body down as if sitting back into a chair, keeping your chest up and your back straight.",
      "Lower yourself until your thigh is parallel to the ground, then push through your heel to return to the starting position.",
      "Repeat for the desired number of repetitions, then switch legs and repeat."
    ],
    "name": "Barbell One Leg Squat",
    "secondaryMuscles": [
      "Glutes",
      "Hamstrings",
      "Calves"
    ],
    "target": "Quads"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The barbell overhead squat is a compound exercise that targets the quads and requires holding a barbell overhead while performing a squat. It demands significant strength, balance, mobility, and coordination.",
    "difficulty": "advanced",
    "equipment": "barbell",
    "id": "0069",
    "imageAssetId": "0069",
    "instructions": [
      "Stand with your feet shoulder-width apart and toes slightly turned out.",
      "Hold the barbell with a wide grip, positioning it overhead with your arms fully extended.",
      "Engage your core and lower your body down into a squat position, keeping your chest up and knees tracking over your toes.",
      "Pause for a moment at the bottom, then push through your heels to return to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Overhead Squat",
    "secondaryMuscles": [
      "Glutes",
      "Hamstrings",
      "Calves",
      "Core"
    ],
    "target": "Quads"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The barbell preacher curl is an isolation exercise that targets the biceps by using a preacher bench to stabilize the upper arms, minimizing shoulder movement and maximizing biceps engagement. It is performed with a barbell and is effective for building biceps strength and size.",
    "difficulty": "beginner",
    "equipment": "barbell",
    "id": "0070",
    "imageAssetId": "0070",
    "instructions": [
      "Sit on a preacher bench with your upper arms resting on the pad and your chest against the support.",
      "Grasp the barbell with an underhand grip, slightly wider than shoulder-width apart.",
      "Keeping your upper arms stationary, exhale and curl the barbell up towards your shoulders.",
      "Pause for a moment at the top, squeezing your biceps.",
      "Inhale and slowly lower the barbell back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Preacher Curl",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Biceps"
  },
  {
    "bodyPart": "waist",
    "category": "strength",
    "description": "The barbell press sit-up is an advanced abdominal exercise that combines a traditional sit-up with a barbell press, engaging the abs, shoulders, and chest. It requires significant core strength, coordination, and balance to safely press the barbell while performing the sit-up motion.",
    "difficulty": "advanced",
    "equipment": "barbell",
    "id": "0071",
    "imageAssetId": "0071",
    "instructions": [
      "Lie flat on your back on a mat with your knees bent and feet flat on the ground.",
      "Hold the barbell with an overhand grip, resting it on your chest.",
      "Engaging your abs, slowly lift your upper body off the ground, curling forward until your torso is at a 45-degree angle.",
      "Pause for a moment at the top, then slowly lower your upper body back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Press Sit-up",
    "secondaryMuscles": [
      "Shoulders",
      "Chest"
    ],
    "target": "Abs"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The barbell prone incline curl is a biceps-focused exercise performed lying face down on an incline bench. This position isolates the biceps and minimizes cheating by preventing the use of momentum or swinging. It primarily targets the biceps, with secondary engagement of the forearms.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0072",
    "imageAssetId": "0072",
    "instructions": [
      "Set up an incline bench at a 45-degree angle.",
      "Lie face down on the bench with your chest and stomach resting against it.",
      "Hold a barbell with an underhand grip, shoulder-width apart.",
      "Extend your arms fully, allowing the barbell to hang down towards the floor.",
      "Keeping your upper arms stationary, exhale and curl the weights while contracting your biceps.",
      "Continue to raise the barbell until your biceps are fully contracted and the bar is at shoulder level.",
      "Hold the contracted position for a brief pause as you squeeze your biceps.",
      "Inhale and slowly begin to lower the barbell back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Prone Incline Curl",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Biceps"
  },
  {
    "bodyPart": "back",
    "category": "strength",
    "description": "The barbell pullover is a strength exercise that targets the latissimus dorsi (lats) and also engages the chest and triceps. It involves lying on a bench and moving a barbell in an arc from above the chest to behind the head, emphasizing a stretch and contraction of the upper body muscles.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0073",
    "imageAssetId": "0073",
    "instructions": [
      "Lie flat on a bench with your head at one end and your feet on the floor.",
      "Hold a barbell with a shoulder-width grip and extend your arms straight above your chest.",
      "Keeping your arms straight, lower the barbell behind your head in a controlled manner until you feel a stretch in your lats.",
      "Pause for a moment, then raise the barbell back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Pullover",
    "secondaryMuscles": [
      "Chest",
      "Triceps"
    ],
    "target": "Lats"
  },
  {
    "bodyPart": "back",
    "category": "strength",
    "description": "The barbell pullover to press is a compound exercise that targets the lats and also works the triceps, chest, and shoulders. It involves lowering a barbell behind your head while lying on a bench, then pressing it back up over your chest.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0022",
    "imageAssetId": "0022",
    "instructions": [
      "Lie flat on a bench with your head at one end and your feet on the ground.",
      "Hold the barbell with a pronated grip (palms facing away from you) and extend your arms straight above your chest.",
      "Keeping your arms straight, lower the barbell behind your head in an arc-like motion until you feel a stretch in your lats.",
      "Pause for a moment, then reverse the motion and press the barbell back to the starting position above your chest.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Pullover To Press",
    "secondaryMuscles": [
      "Triceps",
      "Chest",
      "Shoulders"
    ],
    "target": "Lats"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The barbell rear delt raise is an isolation exercise targeting the rear deltoids, with secondary emphasis on the traps and rhomboids. It is performed by hinging at the hips and raising a barbell out to the sides, focusing on shoulder movement.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0075",
    "imageAssetId": "0075",
    "instructions": [
      "Stand with your feet shoulder-width apart and hold a barbell with an overhand grip, palms facing down.",
      "Bend your knees slightly and hinge forward at the hips, keeping your back straight.",
      "Raise the barbell out to the sides, keeping your arms straight, until they are parallel to the ground.",
      "Pause for a moment at the top, then slowly lower the barbell back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Rear Delt Raise",
    "secondaryMuscles": [
      "Traps",
      "Rhomboids"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The barbell rear delt row is a compound exercise targeting the rear deltoids, with secondary emphasis on the trapezius, rhomboids, and biceps. It involves pulling a barbell towards the chest while bent over, focusing on squeezing the shoulder blades together to engage the upper back and rear shoulders.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0076",
    "imageAssetId": "0076",
    "instructions": [
      "Stand with your feet shoulder-width apart and knees slightly bent.",
      "Hold a barbell with an overhand grip, hands slightly wider than shoulder-width apart.",
      "Bend forward at the hips, keeping your back straight and chest up.",
      "Pull the barbell towards your chest, squeezing your shoulder blades together.",
      "Pause for a moment at the top, then slowly lower the barbell back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Rear Delt Row",
    "secondaryMuscles": [
      "Trapezius",
      "Rhomboids",
      "Biceps"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The barbell reverse curl is an exercise targeting the biceps and forearms, performed by curling a barbell with an overhand grip.",
    "difficulty": "beginner",
    "equipment": "barbell",
    "id": "0080",
    "imageAssetId": "0080",
    "instructions": [
      "Stand up straight with your feet shoulder-width apart and hold a barbell with an overhand grip, palms facing down.",
      "Keep your upper arms stationary and exhale as you curl the barbell upward, contracting your biceps.",
      "Continue to raise the barbell until your biceps are fully contracted and the barbell is at shoulder level.",
      "Hold the contracted position for a brief pause as you squeeze your biceps.",
      "Inhale as you slowly lower the barbell back to the starting position, keeping your upper arms stationary.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Reverse Curl",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Biceps"
  },
  {
    "bodyPart": "back",
    "category": "strength",
    "description": "The barbell reverse grip bent over row is a compound exercise targeting the upper back, with secondary emphasis on the biceps and forearms. It involves pulling a barbell towards the lower chest while bent over, requiring good form and core stability.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0118",
    "imageAssetId": "0118",
    "instructions": [
      "Stand with your feet shoulder-width apart and knees slightly bent.",
      "Hold a barbell with an overhand grip, palms facing down, and hands slightly wider than shoulder-width apart.",
      "Bend forward at the hips, keeping your back straight and chest up, until your torso is almost parallel to the floor.",
      "Pull the barbell towards your lower chest, squeezing your shoulder blades together.",
      "Pause for a moment at the top, then slowly lower the barbell back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Reverse Grip Bent Over Row",
    "secondaryMuscles": [
      "Biceps",
      "Forearms"
    ],
    "target": "Upper Back"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The barbell reverse preacher curl is an isolation exercise targeting the biceps and forearms. It is performed on a preacher bench with an overhand grip, emphasizing the brachialis and forearm extensors.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0081",
    "imageAssetId": "0081",
    "instructions": [
      "Sit on a preacher bench with your chest against the pad and your arms extended straight down, holding a barbell with an overhand grip.",
      "Keeping your upper arms stationary, exhale and curl the barbell upward while contracting your biceps.",
      "Continue to raise the barbell until your biceps are fully contracted and the barbell is at shoulder level.",
      "Hold the contracted position for a brief pause as you squeeze your biceps.",
      "Inhale and slowly lower the barbell back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Reverse Preacher Curl",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Biceps"
  },
  {
    "bodyPart": "lower arms",
    "category": "strength",
    "description": "The barbell reverse wrist curl is an isolation exercise targeting the forearms, specifically the wrist extensors. It is performed seated, with the forearms resting on the thighs and the wrists curling a barbell upward using an overhand grip.",
    "difficulty": "beginner",
    "equipment": "barbell",
    "id": "0082",
    "imageAssetId": "0082",
    "instructions": [
      "Sit on a bench with your feet flat on the ground and hold a barbell with an overhand grip, palms facing down.",
      "Rest your forearms on your thighs, allowing your wrists to hang off the edge.",
      "Slowly curl your wrists upward, bringing the barbell towards your body.",
      "Pause for a moment at the top, then slowly lower the barbell back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Reverse Wrist Curl",
    "secondaryMuscles": [
      "Biceps",
      "Brachialis"
    ],
    "target": "Forearms"
  },
  {
    "bodyPart": "lower arms",
    "category": "strength",
    "description": "The barbell reverse wrist curl v. 2 is an isolation exercise that targets the forearms, specifically the extensor muscles. It is performed seated, with the forearms resting on the thighs and the wrists curling a barbell upward using an overhand grip.",
    "difficulty": "beginner",
    "equipment": "barbell",
    "id": "0079",
    "imageAssetId": "0079",
    "instructions": [
      "Sit on a bench with your feet flat on the ground and your knees bent.",
      "Hold a barbell with an overhand grip, palms facing down, and your hands shoulder-width apart.",
      "Rest your forearms on your thighs, allowing your wrists to hang off the edge.",
      "Keeping your forearms stationary, exhale and curl your wrists upward as far as possible.",
      "Hold the contracted position for a brief pause, then inhale and slowly lower the barbell back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Reverse Wrist Curl V. 2",
    "secondaryMuscles": [
      "Biceps",
      "Brachialis"
    ],
    "target": "Forearms"
  },
  {
    "bodyPart": "waist",
    "category": "strength",
    "description": "The barbell rollout is an advanced core exercise that targets the abdominal muscles and also engages the lower back. It requires significant core strength, stability, and control to perform safely and effectively.",
    "difficulty": "advanced",
    "equipment": "barbell",
    "id": "0084",
    "imageAssetId": "0084",
    "instructions": [
      "Kneel on the floor and hold a barbell with both hands, shoulder-width apart.",
      "Roll the barbell forward, extending your arms and keeping your core engaged.",
      "Continue rolling forward until your body is fully extended and your arms are overhead.",
      "Pause for a moment, then slowly roll the barbell back towards your knees, maintaining control.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Rollerout",
    "secondaryMuscles": [
      "Lower Back"
    ],
    "target": "Abs"
  },
  {
    "bodyPart": "waist",
    "category": "strength",
    "description": "The barbell rollout from bench is an advanced core exercise that targets the abdominal muscles, with secondary emphasis on the shoulders and triceps. It requires significant core strength, stability, and control to perform safely and effectively.",
    "difficulty": "advanced",
    "equipment": "barbell",
    "id": "0083",
    "imageAssetId": "0083",
    "instructions": [
      "Start by kneeling on the floor with a barbell placed on a bench in front of you.",
      "Grasp the barbell with an overhand grip, slightly wider than shoulder-width apart.",
      "Keeping your core engaged and your back straight, slowly roll the barbell forward, extending your arms in front of you.",
      "Continue rolling the barbell forward until your body is fully extended and your arms are overhead.",
      "Pause for a moment at the fully extended position, then slowly roll the barbell back towards your body, returning to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Rollerout From Bench",
    "secondaryMuscles": [
      "Shoulders",
      "Triceps"
    ],
    "target": "Abs"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The barbell Romanian deadlift is a strength exercise targeting the glutes, with secondary emphasis on the hamstrings and lower back. It involves hinging at the hips while maintaining a straight back, lowering a barbell to feel a stretch in the hamstrings, and then returning to a standing position.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0085",
    "imageAssetId": "0085",
    "instructions": [
      "Stand with your feet shoulder-width apart and your toes pointing forward.",
      "Hold the barbell with an overhand grip, hands slightly wider than shoulder-width apart.",
      "Bend at the hips, keeping your back straight and your knees slightly bent.",
      "Lower the barbell towards the ground, keeping it close to your body.",
      "Feel the stretch in your hamstrings as you lower the barbell.",
      "Once you feel a stretch in your hamstrings, push your hips forward and stand up straight.",
      "Squeeze your glutes at the top of the movement.",
      "Lower the barbell back down to the starting position and repeat for the desired number of repetitions."
    ],
    "name": "Barbell Romanian Deadlift",
    "secondaryMuscles": [
      "Hamstrings",
      "Lower Back"
    ],
    "target": "Glutes"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The barbell seated behind head military press is a compound shoulder exercise that targets the deltoids, with secondary emphasis on the triceps and upper back. It requires good shoulder mobility and stability, as well as proper technique to avoid injury.",
    "difficulty": "advanced",
    "equipment": "barbell",
    "id": "0086",
    "imageAssetId": "0086",
    "instructions": [
      "Sit on a bench with your back straight and feet flat on the ground.",
      "Hold the barbell with an overhand grip, slightly wider than shoulder-width apart.",
      "Lift the barbell off the rack and bring it down to shoulder level, behind your head.",
      "Press the barbell upward until your arms are fully extended.",
      "Lower the barbell back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Seated Behind Head Military Press",
    "secondaryMuscles": [
      "Triceps",
      "Upper Back"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The barbell seated Bradford Rocky press is a shoulder exercise performed while seated, focusing on pressing a barbell overhead to target the deltoids. It also engages the triceps and upper back as secondary muscles. The movement requires good shoulder mobility, core stability, and pressing strength.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0087",
    "imageAssetId": "0087",
    "instructions": [
      "Sit on a bench with your back straight and feet flat on the ground.",
      "Hold the barbell with an overhand grip, slightly wider than shoulder-width apart.",
      "Lift the barbell to shoulder height, keeping your elbows slightly bent and pointing forward.",
      "Press the barbell overhead, fully extending your arms.",
      "Lower the barbell back to shoulder height and repeat for the desired number of repetitions."
    ],
    "name": "Barbell Seated Bradford Rocky Press",
    "secondaryMuscles": [
      "Triceps",
      "Upper Back"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "lower legs",
    "category": "strength",
    "description": "The barbell seated calf raise is an exercise that targets the calf muscles by lifting a barbell placed on the thighs while seated. It primarily focuses on strengthening the calves and also engages the hamstrings and quadriceps as secondary muscles.",
    "difficulty": "beginner",
    "equipment": "barbell",
    "id": "0088",
    "imageAssetId": "0088",
    "instructions": [
      "Sit on a bench with your feet flat on the floor and a barbell resting on your thighs.",
      "Place the balls of your feet on a raised platform, such as a block or step.",
      "Position the barbell across your thighs and hold it securely with your hands.",
      "Keeping your back straight and your core engaged, lift your heels off the ground by extending your ankles.",
      "Pause for a moment at the top, then slowly lower your heels back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Seated Calf Raise",
    "secondaryMuscles": [
      "Hamstrings",
      "Quadriceps"
    ],
    "target": "Calves"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The barbell seated overhead press is a compound strength exercise targeting the deltoid muscles of the shoulders. It also engages the triceps and upper back as secondary muscles. This movement is performed seated, which helps stabilize the lower body and focus the effort on the upper body. It requires proper technique and shoulder mobility to perform safely and effectively.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0091",
    "imageAssetId": "0091",
    "instructions": [
      "Sit on a bench with your back straight and feet flat on the ground.",
      "Hold the barbell with an overhand grip, slightly wider than shoulder-width apart.",
      "Lift the barbell off the rack and bring it to shoulder level, with your elbows bent and palms facing forward.",
      "Press the barbell overhead by extending your arms fully.",
      "Pause for a moment at the top, then slowly lower the barbell back to shoulder level.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Seated Overhead Press",
    "secondaryMuscles": [
      "Triceps",
      "Upper Back"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "waist",
    "category": "strength",
    "description": "The barbell seated twist is an exercise that targets the abdominal muscles, particularly the obliques and lower back, by rotating the torso while seated and holding a barbell.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0094",
    "imageAssetId": "0094",
    "instructions": [
      "Sit on a flat bench with your feet flat on the ground and your knees bent.",
      "Hold a barbell with both hands in front of your chest, keeping your elbows slightly bent.",
      "Engage your core and slowly twist your torso to one side, keeping your back straight.",
      "Pause for a moment at the end of the twist, then slowly rotate back to the starting position.",
      "Repeat the twist to the other side.",
      "Continue alternating sides for the desired number of repetitions."
    ],
    "name": "Barbell Seated Twist",
    "secondaryMuscles": [
      "Obliques",
      "Lower Back"
    ],
    "target": "Abs"
  },
  {
    "bodyPart": "back",
    "category": "strength",
    "description": "The barbell shrug is a strength exercise targeting the trapezius muscles. It involves lifting the shoulders towards the ears while holding a barbell, focusing on building upper back and neck strength.",
    "difficulty": "beginner",
    "equipment": "barbell",
    "id": "0095",
    "imageAssetId": "0095",
    "instructions": [
      "Stand with your feet shoulder-width apart and hold a barbell in front of you with an overhand grip.",
      "Keep your arms straight and your back straight throughout the exercise.",
      "Lift your shoulders up towards your ears as high as possible, squeezing your traps at the top.",
      "Hold for a moment, then slowly lower your shoulders back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Shrug",
    "secondaryMuscles": [
      "Shoulders"
    ],
    "target": "Traps"
  },
  {
    "bodyPart": "waist",
    "category": "strength",
    "description": "The barbell side bent v. 2 is an exercise targeting the abdominal muscles, particularly the obliques, by bending the torso side to side while holding a barbell. It also engages the lower back for stability.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0096",
    "imageAssetId": "0096",
    "instructions": [
      "Stand with your feet shoulder-width apart and hold a barbell with both hands, palms facing down.",
      "Keep your back straight and core engaged throughout the exercise.",
      "Slowly bend your torso to the right side, lowering the barbell towards your right knee.",
      "Pause for a moment, then return to the starting position.",
      "Repeat the movement on the left side.",
      "Continue alternating sides for the desired number of repetitions."
    ],
    "name": "Barbell Side Bent V. 2",
    "secondaryMuscles": [
      "Obliques",
      "Lower Back"
    ],
    "target": "Abs"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The barbell side split squat is a lower body exercise that targets the quadriceps while also engaging the glutes, hamstrings, and calves. It requires holding a barbell across the upper back and performing a wide-stance squat, emphasizing lateral movement and stability.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0098",
    "imageAssetId": "0098",
    "instructions": [
      "Stand with your feet wider than shoulder-width apart, toes pointing slightly outward.",
      "Hold a barbell across your upper back, resting it on your traps.",
      "Engage your core and keep your chest up as you lower your body down into a squat position, bending at the knees and hips.",
      "As you lower, push your knees out to the sides and keep your weight on your heels.",
      "Lower until your thighs are parallel to the ground, then push through your heels to return to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Side Split Squat",
    "secondaryMuscles": [
      "Glutes",
      "Hamstrings",
      "Calves"
    ],
    "target": "Quads"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The barbell side split squat v. 2 is a lower body exercise that targets the quadriceps while also engaging the glutes, hamstrings, and calves. It involves stepping laterally into a squat position while holding a barbell across the upper back, requiring strength, balance, and coordination.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0097",
    "imageAssetId": "0097",
    "instructions": [
      "Stand with your feet wider than shoulder-width apart, toes pointing slightly outwards.",
      "Hold a barbell across your upper back, resting it on your shoulders.",
      "Take a big step to the side with your right foot, keeping your left foot planted.",
      "Bend your right knee and lower your body down into a squat position, keeping your chest up and your back straight.",
      "Push through your right heel to return to the starting position.",
      "Repeat on the other side, stepping out with your left foot.",
      "Continue alternating sides for the desired number of repetitions."
    ],
    "name": "Barbell Side Split Squat V. 2",
    "secondaryMuscles": [
      "Glutes",
      "Hamstrings",
      "Calves"
    ],
    "target": "Quads"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The barbell single leg split squat is a lower body exercise that targets the quadriceps while also engaging the glutes, hamstrings, and calves. It requires balance, coordination, and strength, as you perform a squat movement with one leg forward and a barbell across your upper back.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0099",
    "imageAssetId": "0099",
    "instructions": [
      "Stand with your feet shoulder-width apart, holding a barbell across your upper back.",
      "Take a large step forward with one leg, keeping your torso upright.",
      "Lower your body by bending your front knee and hip, while keeping your back leg straight.",
      "Continue lowering until your front thigh is parallel to the ground.",
      "Pause for a moment, then push through your front heel to return to the starting position.",
      "Repeat for the desired number of repetitions, then switch legs."
    ],
    "name": "Barbell Single Leg Split Squat",
    "secondaryMuscles": [
      "Glutes",
      "Hamstrings",
      "Calves"
    ],
    "target": "Quads"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The barbell skier is a dynamic shoulder exercise that involves lifting a barbell while performing a small jump, targeting the deltoids and engaging the triceps and core for stability.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0100",
    "imageAssetId": "0100",
    "instructions": [
      "Stand with your feet shoulder-width apart and hold a barbell in front of your thighs with an overhand grip.",
      "Bend your knees slightly and hinge forward at the hips, keeping your back straight and chest up.",
      "Simultaneously lift the barbell up towards your shoulders while jumping slightly off the ground.",
      "As you reach the top of the movement, quickly reverse the motion and lower the barbell back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Skier",
    "secondaryMuscles": [
      "Triceps",
      "Core"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The barbell split squat v. 2 is a lower body strength exercise that targets the quadriceps, while also engaging the glutes, hamstrings, and calves. It involves stepping forward into a split stance and lowering the body with a barbell across the upper back.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "2810",
    "imageAssetId": "2810",
    "instructions": [
      "Start by standing with your feet shoulder-width apart, holding a barbell across your upper back.",
      "Take a large step forward with your right foot, keeping your torso upright.",
      "Lower your body by bending your knees and hips until your right thigh is parallel to the ground.",
      "Pause for a moment, then push through your right heel to return to the starting position.",
      "Repeat with your left leg forward for the desired number of repetitions."
    ],
    "name": "Barbell Split Squat V. 2",
    "secondaryMuscles": [
      "Glutes",
      "Hamstrings",
      "Calves"
    ],
    "target": "Quads"
  },
  {
    "bodyPart": "waist",
    "category": "strength",
    "description": "The barbell standing ab rollerout is an advanced core exercise that targets the abs, with secondary emphasis on the shoulders and lower back. It requires significant core strength, stability, and control to perform safely and effectively.",
    "difficulty": "advanced",
    "equipment": "barbell",
    "id": "0103",
    "imageAssetId": "0103",
    "instructions": [
      "Stand upright with your feet shoulder-width apart and hold the barbell with both hands in front of your thighs.",
      "Engage your core and slowly roll the barbell down towards the ground, keeping your back straight and your arms extended.",
      "Continue rolling the barbell forward until your body is fully extended and your hands are directly above your head.",
      "Pause for a moment, then slowly roll the barbell back towards your thighs, maintaining control and keeping your core engaged.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Standing Ab Rollerout",
    "secondaryMuscles": [
      "Shoulders",
      "Lower Back"
    ],
    "target": "Abs"
  },
  {
    "bodyPart": "lower arms",
    "category": "strength",
    "description": "The barbell standing back wrist curl is an isolation exercise targeting the forearms, specifically the wrist extensors. It involves curling the barbell upwards using only the wrists while standing.",
    "difficulty": "beginner",
    "equipment": "barbell",
    "id": "0104",
    "imageAssetId": "0104",
    "instructions": [
      "Stand up straight with your feet shoulder-width apart and hold a barbell with an overhand grip.",
      "Rest the barbell on the back of your hands with your palms facing down and your fingers pointing towards your body.",
      "Keeping your upper arms stationary, exhale and curl your wrists upwards as far as possible.",
      "Hold the contracted position for a brief pause, then inhale and slowly lower the barbell back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Standing Back Wrist Curl",
    "secondaryMuscles": [
      "Biceps",
      "Shoulders"
    ],
    "target": "Forearms"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The barbell standing Bradford press is a shoulder exercise that targets the deltoids and also works the triceps and upper back. It involves pressing a barbell overhead from the front of the shoulders, requiring strength, coordination, and shoulder mobility.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0105",
    "imageAssetId": "0105",
    "instructions": [
      "Stand with your feet shoulder-width apart and hold the barbell in front of your shoulders with an overhand grip.",
      "Press the barbell overhead, fully extending your arms.",
      "Lower the barbell back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Standing Bradford Press",
    "secondaryMuscles": [
      "Triceps",
      "Upper Back"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The barbell standing front raise over head is a shoulder exercise that targets the deltoids, with secondary emphasis on the triceps and upper back. It involves lifting a barbell from thigh level to overhead while standing, requiring control and shoulder strength.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0107",
    "imageAssetId": "0107",
    "instructions": [
      "Stand with your feet shoulder-width apart, holding a barbell in front of your thighs with an overhand grip.",
      "Keep your back straight and engage your core.",
      "Slowly raise the barbell in front of you, keeping your arms straight and your palms facing down.",
      "Continue lifting until the barbell is slightly above shoulder level.",
      "Pause for a moment at the top, then slowly lower the barbell back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Standing Front Raise Over Head",
    "secondaryMuscles": [
      "Triceps",
      "Upper Back"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "lower legs",
    "category": "strength",
    "description": "The barbell standing leg calf raise is a strength exercise targeting the calves. It involves standing with a barbell across your upper back and raising your heels off the ground to engage the calf muscles.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0108",
    "imageAssetId": "0108",
    "instructions": [
      "Stand with your feet shoulder-width apart and place a barbell across your upper back.",
      "Raise your heels off the ground as high as possible, using your calves.",
      "Pause for a moment at the top, then slowly lower your heels back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Standing Leg Calf Raise",
    "secondaryMuscles": [
      "Hamstrings",
      "Glutes"
    ],
    "target": "Calves"
  },
  {
    "bodyPart": "lower legs",
    "category": "strength",
    "description": "The barbell standing rocking leg calf raise targets the calves and involves raising your heels while balancing a barbell across your upper back. This exercise also engages the hamstrings and quadriceps as secondary muscles.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0111",
    "imageAssetId": "0111",
    "instructions": [
      "Stand with your feet shoulder-width apart and hold a barbell across your upper back.",
      "Raise your heels off the ground as high as possible, balancing on the balls of your feet.",
      "Slowly lower your heels back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Standing Rocking Leg Calf Raise",
    "secondaryMuscles": [
      "Hamstrings",
      "Quadriceps"
    ],
    "target": "Calves"
  },
  {
    "bodyPart": "waist",
    "category": "strength",
    "description": "The barbell standing twist is an exercise targeting the abdominal muscles, particularly the obliques and lower back, by rotating the torso while holding a barbell. It helps improve core strength and rotational stability.",
    "difficulty": "beginner",
    "equipment": "barbell",
    "id": "0112",
    "imageAssetId": "0112",
    "instructions": [
      "Stand with your feet shoulder-width apart and hold a barbell in front of your chest with both hands, palms facing down.",
      "Engage your core and keep your back straight throughout the exercise.",
      "Slowly twist your torso to the right, pivoting on your feet and hips, while keeping your lower body stable.",
      "Pause for a moment at the end of the twist, then slowly return to the starting position.",
      "Repeat the twist to the left side.",
      "Continue alternating twists for the desired number of repetitions."
    ],
    "name": "Barbell Standing Twist",
    "secondaryMuscles": [
      "Obliques",
      "Lower Back"
    ],
    "target": "Abs"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The barbell upright row is a compound exercise that targets the deltoids and also works the traps and biceps. It involves lifting a barbell from the thighs to the upper chest, leading with the elbows.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0120",
    "imageAssetId": "0120",
    "instructions": [
      "Stand with your feet shoulder-width apart and hold a barbell with an overhand grip, hands slightly wider than shoulder-width apart.",
      "Let the barbell hang in front of your thighs, arms fully extended.",
      "Keeping your back straight and core engaged, exhale and lift the barbell straight up towards your chin, leading with your elbows.",
      "Pause for a moment at the top, then inhale and slowly lower the barbell back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Upright Row",
    "secondaryMuscles": [
      "Traps",
      "Biceps"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The barbell upright row v. 2 is a compound exercise targeting the deltoids, with secondary emphasis on the traps and biceps. It involves lifting a barbell from the thighs to the upper chest by leading with the elbows, requiring good form to avoid shoulder impingement.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0119",
    "imageAssetId": "0119",
    "instructions": [
      "Stand with your feet shoulder-width apart and hold a barbell with an overhand grip, hands slightly wider than shoulder-width apart.",
      "Let the barbell hang in front of your thighs, arms fully extended.",
      "Keeping your back straight, exhale and lift the barbell straight up towards your chin, leading with your elbows.",
      "Pause for a moment at the top, then inhale and slowly lower the barbell back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Upright Row V. 2",
    "secondaryMuscles": [
      "Traps",
      "Biceps"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The barbell upright row v. 3 is a compound exercise targeting the deltoids, with secondary emphasis on the traps and biceps. It involves lifting a barbell from thigh level to chin height, leading with the elbows.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0121",
    "imageAssetId": "0121",
    "instructions": [
      "Stand with your feet shoulder-width apart and hold a barbell with an overhand grip, hands slightly wider than shoulder-width apart.",
      "Let the barbell hang in front of your thighs, arms fully extended.",
      "Keeping your core engaged and back straight, exhale as you lift the barbell straight up towards your chin, leading with your elbows.",
      "Pause for a moment at the top, then inhale as you slowly lower the barbell back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Upright Row V. 3",
    "secondaryMuscles": [
      "Traps",
      "Biceps"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "chest",
    "category": "strength",
    "description": "The barbell wide bench press is a compound strength exercise targeting the pectoral muscles, with secondary emphasis on the shoulders and triceps. It requires a barbell and a bench, and involves lowering the barbell to the chest with a wide grip before pressing it back up.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0122",
    "imageAssetId": "0122",
    "instructions": [
      "Lie flat on a bench with your feet flat on the ground and your back pressed against the bench.",
      "Grasp the barbell with a wide grip, slightly wider than shoulder-width apart.",
      "Lift the barbell off the rack and hold it directly above your chest with your arms fully extended.",
      "Lower the barbell slowly towards your chest, keeping your elbows slightly flared out.",
      "Pause for a moment when the barbell touches your chest, then push it back up to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Wide Bench Press",
    "secondaryMuscles": [
      "Shoulders",
      "Triceps"
    ],
    "target": "Pectorals"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The barbell wide-grip upright row is a compound exercise targeting the deltoids, with secondary emphasis on the traps and biceps. It involves lifting a barbell with a wide grip from the thighs to the upper chest, focusing on leading with the elbows.",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "id": "0123",
    "imageAssetId": "0123",
    "instructions": [
      "Stand with your feet shoulder-width apart and hold a barbell with an overhand grip, hands wider than shoulder-width apart.",
      "Let the barbell hang in front of your thighs, arms fully extended.",
      "Keeping your back straight, exhale and lift the barbell straight up towards your chin, leading with your elbows.",
      "Pause for a moment at the top, then inhale and slowly lower the barbell back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Wide-grip Upright Row",
    "secondaryMuscles": [
      "Traps",
      "Biceps"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "lower arms",
    "category": "strength",
    "description": "The barbell wrist curl is an isolation exercise targeting the forearm muscles, particularly the wrist flexors. It is performed seated, with the forearms resting on the thighs and the wrists curling a barbell upward.",
    "difficulty": "beginner",
    "equipment": "barbell",
    "id": "0126",
    "imageAssetId": "0126",
    "instructions": [
      "Sit on a bench with your feet flat on the ground and your forearms resting on your thighs, holding a barbell with an underhand grip.",
      "Allow the barbell to roll down to your fingertips, keeping your wrists straight.",
      "Slowly curl the barbell up towards your forearms by flexing your wrists.",
      "Pause for a moment at the top, then slowly lower the barbell back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Wrist Curl",
    "secondaryMuscles": [
      "Biceps",
      "Brachialis"
    ],
    "target": "Forearms"
  },
  {
    "bodyPart": "lower arms",
    "category": "strength",
    "description": "The barbell wrist curl v. 2 is an isolation exercise that targets the forearm muscles, specifically the wrist flexors. It is performed seated, with the forearms resting on the thighs and the wrists hanging off the edge, curling a barbell upward using only the wrists.",
    "difficulty": "beginner",
    "equipment": "barbell",
    "id": "0125",
    "imageAssetId": "0125",
    "instructions": [
      "Sit on a bench with your feet flat on the ground and your knees bent.",
      "Hold a barbell with an underhand grip, palms facing up, and your hands shoulder-width apart.",
      "Rest your forearms on your thighs, allowing your wrists to hang off the edge.",
      "Slowly curl your wrists upward, bringing the barbell towards your forearms.",
      "Pause for a moment at the top, then slowly lower the barbell back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Barbell Wrist Curl V. 2",
    "secondaryMuscles": [
      "Biceps",
      "Brachialis"
    ],
    "target": "Forearms"
  },
  {
    "bodyPart": "shoulders",
    "category": "cardio",
    "description": "Battling ropes is a dynamic exercise that targets the deltoids while also engaging the forearms and core. It involves making rapid, alternating waves with heavy ropes, providing both a strength and cardiovascular challenge.",
    "difficulty": "intermediate",
    "equipment": "rope",
    "id": "0128",
    "imageAssetId": "0128",
    "instructions": [
      "Stand with your feet shoulder-width apart and knees slightly bent.",
      "Hold one end of the rope in each hand, with your palms facing each other.",
      "Raise your arms to shoulder height, keeping your elbows slightly bent.",
      "Begin making alternating waves with the ropes by rapidly raising and lowering each arm.",
      "Continue for the desired duration or number of repetitions."
    ],
    "name": "Battling Ropes",
    "secondaryMuscles": [
      "Forearms",
      "Core"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "cardio",
    "category": "cardio",
    "description": "The bear crawl is a full-body movement that targets the cardiovascular system while also engaging the core, shoulders, and triceps. It involves crawling on all fours with knees off the ground, requiring coordination and endurance.",
    "difficulty": "intermediate",
    "equipment": "body weight",
    "id": "3360",
    "imageAssetId": "3360",
    "instructions": [
      "Start on all fours with your hands directly under your shoulders and your knees directly under your hips.",
      "Lift your knees slightly off the ground, keeping your back flat and your core engaged.",
      "Move your right hand and left foot forward simultaneously, followed by your left hand and right foot.",
      "Continue crawling forward, alternating your hand and foot movements.",
      "Maintain a steady pace and keep your core tight throughout the exercise.",
      "Continue for the desired distance or time."
    ],
    "name": "Bear Crawl",
    "secondaryMuscles": [
      "Core",
      "Shoulders",
      "Triceps"
    ],
    "target": "Cardiovascular System"
  },
  {
    "bodyPart": "waist",
    "category": "strength",
    "description": "The bottoms-up exercise is a bodyweight movement targeting the abdominal muscles. It involves lying on your back, bringing your knees toward your chest, and lifting your hips off the ground to engage your core.",
    "difficulty": "intermediate",
    "equipment": "body weight",
    "id": "0138",
    "imageAssetId": "0138",
    "instructions": [
      "Lie flat on your back with your legs extended and your arms by your sides.",
      "Bend your knees and bring them towards your chest, keeping your feet off the ground.",
      "Engaging your abs, lift your hips off the ground, bringing your knees towards your head.",
      "Pause for a moment at the top, then slowly lower your hips back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Bottoms-up",
    "secondaryMuscles": [
      "Obliques",
      "Hip Flexors"
    ],
    "target": "Abs"
  },
  {
    "bodyPart": "cardio",
    "category": "cardio",
    "description": "The burpee is a full-body exercise that combines a squat, push-up, and jump to elevate heart rate and build strength and endurance.",
    "difficulty": "intermediate",
    "equipment": "body weight",
    "id": "1160",
    "imageAssetId": "1160",
    "instructions": [
      "Start in a standing position with your feet shoulder-width apart.",
      "Lower your body into a squat position by bending your knees and placing your hands on the floor in front of you.",
      "Kick your feet back into a push-up position.",
      "Perform a push-up, keeping your body in a straight line.",
      "Jump your feet back into the squat position.",
      "Jump up explosively, reaching your arms overhead.",
      "Land softly and immediately lower back into a squat position to begin the next repetition."
    ],
    "name": "Burpee",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Calves",
      "Shoulders",
      "Chest"
    ],
    "target": "Cardiovascular System"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The cable alternate shoulder press is a strength exercise targeting the deltoid muscles. It involves pressing one cable handle overhead at a time, alternating arms, and requires stability and coordination.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "0148",
    "imageAssetId": "0148",
    "instructions": [
      "Stand with your feet shoulder-width apart and grasp the handles of the cable machine with an overhand grip.",
      "Position your hands at shoulder height, with your palms facing forward.",
      "Keep your core engaged and your back straight.",
      "Press one handle up and forward until your arm is fully extended.",
      "Pause for a moment at the top, then slowly lower the handle back to the starting position.",
      "Repeat with the other arm.",
      "Alternate between arms for the desired number of repetitions."
    ],
    "name": "Cable Alternate Shoulder Press",
    "secondaryMuscles": [
      "Triceps",
      "Upper Back"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "back",
    "category": "strength",
    "description": "The cable bar lateral pulldown is a strength exercise targeting the latissimus dorsi (lats) using a cable machine and a straight bar attachment. It also engages the biceps, rhomboids, and rear deltoids. The movement involves pulling the bar down towards the chest while maintaining proper posture and control.",
    "difficulty": "beginner",
    "equipment": "cable",
    "id": "0150",
    "imageAssetId": "0150",
    "instructions": [
      "Adjust the cable pulley to a high position and attach a straight bar.",
      "Sit facing the cable machine with your feet flat on the ground and your knees slightly bent.",
      "Grasp the bar with an overhand grip, slightly wider than shoulder-width apart.",
      "Lean back slightly and keep your chest up, maintaining a slight arch in your lower back.",
      "Pull the bar down towards your chest, leading with your elbows and squeezing your shoulder blades together.",
      "Pause for a moment at the bottom of the movement, then slowly return the bar to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Bar Lateral Pulldown",
    "secondaryMuscles": [
      "Biceps",
      "Rhomboids",
      "Rear Deltoids"
    ],
    "target": "Lats"
  },
  {
    "bodyPart": "chest",
    "category": "strength",
    "description": "The cable bench press is a chest exercise performed using a cable machine. It targets the pectoral muscles and also works the triceps and shoulders. The movement is similar to a traditional bench press but uses cables for constant tension throughout the range of motion.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "0151",
    "imageAssetId": "0151",
    "instructions": [
      "Adjust the cable machine to chest height and attach the handles.",
      "Stand facing away from the machine with your feet shoulder-width apart.",
      "Grasp the handles with an overhand grip and step forward to create tension in the cables.",
      "Position your feet firmly on the ground and engage your core.",
      "Bend your elbows and bring your hands to shoulder level, keeping your elbows at a 90-degree angle.",
      "Push the handles forward, extending your arms fully in front of you.",
      "Pause for a moment, then slowly reverse the movement, bringing your hands back to shoulder level.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Bench Press",
    "secondaryMuscles": [
      "Triceps",
      "Shoulders"
    ],
    "target": "Pectorals"
  },
  {
    "bodyPart": "back",
    "category": "strength",
    "description": "The cable cross-over lateral pulldown is a cable machine exercise targeting the latissimus dorsi, with secondary emphasis on the biceps, rhomboids, and rear deltoids. It involves pulling cables down and across the body, requiring coordination and control.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "0153",
    "imageAssetId": "0153",
    "instructions": [
      "Attach a cable handle to each side of a cable machine at shoulder height.",
      "Stand in the middle of the machine with your feet shoulder-width apart.",
      "Grasp the handles with an overhand grip and step back to create tension in the cables.",
      "Lean forward slightly from the hips, keeping your back straight and your chest up.",
      "Pull the handles down and across your body, squeezing your shoulder blades together.",
      "Pause for a moment at the bottom of the movement, then slowly return to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Cross-over Lateral Pulldown",
    "secondaryMuscles": [
      "Biceps",
      "Rhomboids",
      "Rear Deltoids"
    ],
    "target": "Lats"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The cable cross-over reverse fly is an isolation exercise targeting the rear deltoids, with secondary emphasis on the rhomboids and trapezius. It is performed using a cable crossover machine and requires good posture, control, and coordination.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "0154",
    "imageAssetId": "0154",
    "instructions": [
      "Attach a D-handle to each low pulley cable and stand in the middle of the cable crossover machine.",
      "Grasp the handles with a pronated grip (palms facing down) and take a step forward, positioning your feet shoulder-width apart.",
      "Bend your knees slightly and lean forward at the waist, keeping your back straight and your abs engaged.",
      "With your arms extended out to the sides and slightly bent at the elbows, exhale and squeeze your shoulder blades together as you pull the cables back and upward in a reverse fly motion.",
      "Pause for a moment at the peak contraction, then inhale and slowly return to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Cross-over Reverse Fly",
    "secondaryMuscles": [
      "Rhomboids",
      "Trapezius"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "chest",
    "category": "strength",
    "description": "The cable cross-over variation is a chest exercise performed using a cable machine. It targets the pectoral muscles and also engages the deltoids and triceps. The movement involves bringing the handles together in front of the chest while maintaining a slight bend in the elbows.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "0155",
    "imageAssetId": "0155",
    "instructions": [
      "Adjust the cable pulleys to chest height.",
      "Stand in the center of the cable machine with one foot in front of the other.",
      "Grasp the handles with your palms facing down and your arms extended out to the sides.",
      "Take a step forward, keeping your arms slightly bent.",
      "With a slight bend in your elbows, bring your hands together in front of your chest.",
      "Pause for a moment, then slowly return your arms back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Cross-over Variation",
    "secondaryMuscles": [
      "Deltoids",
      "Triceps"
    ],
    "target": "Pectorals"
  },
  {
    "bodyPart": "chest",
    "category": "strength",
    "description": "The cable decline fly is an isolation exercise targeting the pectoral muscles using a cable machine set to a decline angle. It emphasizes the lower chest and involves controlled arm movement to stretch and contract the chest muscles.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "0158",
    "imageAssetId": "0158",
    "instructions": [
      "Adjust the cable machine to a decline position.",
      "Stand facing away from the machine with your feet shoulder-width apart.",
      "Hold the handles with your palms facing forward and your arms extended straight out in front of you.",
      "Keeping a slight bend in your elbows, open your arms out to the sides in a controlled motion.",
      "Pause for a moment at the fully extended position, then slowly return to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Decline Fly",
    "secondaryMuscles": [
      "Shoulders",
      "Triceps"
    ],
    "target": "Pectorals"
  },
  {
    "bodyPart": "back",
    "category": "strength",
    "description": "The cable decline seated wide-grip row is a strength exercise targeting the upper back, performed on a decline bench using a cable machine. It also engages the biceps and forearms as secondary muscles.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "0159",
    "imageAssetId": "0159",
    "instructions": [
      "Sit on the decline bench facing the cable machine with your feet securely placed on the footrests.",
      "Grasp the cable attachment with a wide overhand grip, palms facing down.",
      "Lean back slightly, keeping your back straight and your core engaged.",
      "Pull the cable towards your lower chest, squeezing your shoulder blades together.",
      "Pause for a moment at the peak of the contraction, then slowly release the cable back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Decline Seated Wide-grip Row",
    "secondaryMuscles": [
      "Biceps",
      "Forearms"
    ],
    "target": "Upper Back"
  },
  {
    "bodyPart": "back",
    "category": "strength",
    "description": "The cable floor seated wide-grip row is a strength exercise targeting the upper back, performed seated on the floor using a cable machine. It emphasizes scapular retraction and upper back engagement, with secondary activation of the biceps and forearms.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "0160",
    "imageAssetId": "0160",
    "instructions": [
      "Sit on the floor with your legs extended and your back straight.",
      "Attach a cable handle to a low pulley and position the cable machine behind you.",
      "Grasp the handle with a wide overhand grip, palms facing down.",
      "Lean back slightly, keeping your back straight and your chest lifted.",
      "Pull the handle towards your waist, squeezing your shoulder blades together.",
      "Pause for a moment at the top of the movement, then slowly release the handle back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Floor Seated Wide-grip Row",
    "secondaryMuscles": [
      "Biceps",
      "Forearms"
    ],
    "target": "Upper Back"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The cable forward raise is an isolation exercise targeting the deltoid muscles of the shoulders. It involves lifting a cable handle in front of the body to shoulder height, emphasizing shoulder strength and stability.",
    "difficulty": "beginner",
    "equipment": "cable",
    "id": "0161",
    "imageAssetId": "0161",
    "instructions": [
      "Stand with your feet shoulder-width apart and your knees slightly bent.",
      "Hold the cable handle with an overhand grip, palms facing down, and your arms fully extended in front of you.",
      "Keeping your arms straight, raise the cable handle up to shoulder level.",
      "Pause for a moment at the top, then slowly lower the cable handle back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Forward Raise",
    "secondaryMuscles": [
      "Triceps",
      "Forearms"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The cable front raise is a shoulder exercise that targets the deltoid muscles, particularly the anterior (front) delts. It involves lifting a cable handle in front of the body to shoulder height, emphasizing controlled movement and muscle engagement.",
    "difficulty": "beginner",
    "equipment": "cable",
    "id": "0162",
    "imageAssetId": "0162",
    "instructions": [
      "Stand with your feet shoulder-width apart and grasp the cable handle with an overhand grip.",
      "Keep your back straight and your core engaged.",
      "Raise the cable handle in front of you, keeping your arms straight and your palms facing down.",
      "Continue lifting until your arms are parallel to the floor.",
      "Pause for a moment at the top, then slowly lower the cable handle back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Front Raise",
    "secondaryMuscles": [
      "Triceps",
      "Forearms"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The cable front shoulder raise is an isolation exercise that targets the deltoid muscles of the shoulders, using a cable machine to provide constant tension throughout the movement. It also engages the trapezius and biceps as secondary muscles.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "0164",
    "imageAssetId": "0164",
    "instructions": [
      "Stand with your feet shoulder-width apart and grasp the cable handle with an overhand grip.",
      "Keep your back straight and your core engaged.",
      "Raise the cable handle in front of you, keeping your arms straight and your palms facing down.",
      "Continue lifting until your arms are parallel to the floor.",
      "Pause for a moment at the top, then slowly lower the cable handle back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Front Shoulder Raise",
    "secondaryMuscles": [
      "Trapezius",
      "Biceps"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The cable hammer curl (with rope) is an isolation exercise targeting the biceps and forearms, performed using a cable machine with a rope attachment. It emphasizes the brachialis and brachioradialis muscles, providing constant tension throughout the movement.",
    "difficulty": "beginner",
    "equipment": "cable",
    "id": "0165",
    "imageAssetId": "0165",
    "instructions": [
      "Stand upright with your feet shoulder-width apart and a slight bend in your knees.",
      "Hold the cable rope attachment with an underhand grip, palms facing each other, and your arms fully extended.",
      "Keeping your upper arms stationary, exhale and curl the weights while contracting your biceps.",
      "Continue to raise the cable rope attachment until your biceps are fully contracted and the rope is at shoulder level.",
      "Hold the contracted position for a brief pause as you squeeze your biceps.",
      "Inhale and slowly begin to lower the cable rope attachment back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Hammer Curl (with Rope)",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Biceps"
  },
  {
    "bodyPart": "back",
    "category": "strength",
    "description": "The cable high row (kneeling) is a strength exercise targeting the upper back, performed using a cable machine while kneeling. It emphasizes scapular retraction and upper back engagement, with secondary involvement of the biceps and shoulders.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "0167",
    "imageAssetId": "0167",
    "instructions": [
      "Attach a straight bar to a cable machine at chest height.",
      "Kneel down in front of the cable machine and grab the bar with an overhand grip, hands shoulder-width apart.",
      "Sit back on your heels, keeping your back straight and your core engaged.",
      "Pull the bar towards your upper abdomen, squeezing your shoulder blades together.",
      "Pause for a moment at the top of the movement, then slowly release the bar back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable High Row (kneeling)",
    "secondaryMuscles": [
      "Biceps",
      "Shoulders"
    ],
    "target": "Upper Back"
  },
  {
    "bodyPart": "chest",
    "category": "strength",
    "description": "The cable incline bench press is a chest exercise performed on an incline bench using cable handles. It targets the upper pectorals and also works the deltoids and triceps. The cable resistance provides constant tension throughout the movement, making it effective for building strength and muscle in the upper chest.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "0169",
    "imageAssetId": "0169",
    "instructions": [
      "Adjust the bench to a 45-degree incline.",
      "Attach the cable handles to the high pulleys.",
      "Sit on the bench facing the cable machine with your feet flat on the ground.",
      "Grasp the handles with an overhand grip and bring them to shoulder height.",
      "Push the handles forward and upward until your arms are fully extended.",
      "Pause for a moment, then slowly lower the handles back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Incline Bench Press",
    "secondaryMuscles": [
      "Deltoids",
      "Triceps"
    ],
    "target": "Pectorals"
  },
  {
    "bodyPart": "chest",
    "category": "strength",
    "description": "The cable incline fly is an isolation exercise targeting the upper chest (pectorals) using a cable machine. It involves opening and closing the arms in a fly motion while lying on an incline bench, providing constant tension throughout the movement.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "0171",
    "imageAssetId": "0171",
    "instructions": [
      "Adjust the cable machine to a low position and attach the handles.",
      "Sit on an incline bench with your back against the pad and feet flat on the floor.",
      "Grasp the handles with an overhand grip and extend your arms straight out in front of you.",
      "Keeping a slight bend in your elbows, open your arms out to the sides in a controlled motion.",
      "Pause for a moment at the fully extended position, then slowly return to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Incline Fly",
    "secondaryMuscles": [
      "Deltoids",
      "Triceps"
    ],
    "target": "Pectorals"
  },
  {
    "bodyPart": "chest",
    "category": "strength",
    "description": "The cable incline fly on a stability ball is a chest isolation exercise that uses cables and a stability ball to target the pectoral muscles while also engaging the core and stabilizer muscles. The instability of the ball increases the balance and coordination required.",
    "difficulty": "advanced",
    "equipment": "cable",
    "id": "0170",
    "imageAssetId": "0170",
    "instructions": [
      "Set up a stability ball at an incline angle.",
      "Attach the cable handles to the high pulleys of a cable machine.",
      "Sit on the stability ball facing away from the machine, with your feet firmly planted on the ground.",
      "Grasp the cable handles with an overhand grip, palms facing forward.",
      "Lean forward slightly, keeping your back straight and core engaged.",
      "With a controlled motion, bring your arms out to the sides, keeping a slight bend in your elbows.",
      "Continue the motion until your arms are parallel to the ground.",
      "Pause for a moment, then slowly return to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Incline Fly (on Stability Ball)",
    "secondaryMuscles": [
      "Deltoids",
      "Triceps"
    ],
    "target": "Pectorals"
  },
  {
    "bodyPart": "back",
    "category": "strength",
    "description": "The cable incline pushdown is an isolation exercise targeting the latissimus dorsi, performed using a cable machine with a straight bar attachment. It emphasizes controlled movement and proper form to effectively engage the lats while also involving the triceps and shoulders as secondary muscles.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "0172",
    "imageAssetId": "0172",
    "instructions": [
      "Attach a straight bar to a high pulley cable machine.",
      "Stand facing away from the machine with your feet shoulder-width apart.",
      "Grasp the bar with an overhand grip, hands slightly wider than shoulder-width apart.",
      "Lean forward slightly and keep your back straight.",
      "Pull the bar down towards your thighs by extending your elbows.",
      "Pause for a moment at the bottom, then slowly return the bar to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Incline Pushdown",
    "secondaryMuscles": [
      "Triceps",
      "Shoulders"
    ],
    "target": "Lats"
  },
  {
    "bodyPart": "waist",
    "category": "strength",
    "description": "The cable judo flip is a rotational core exercise that targets the abs, obliques, and shoulders using a cable machine. It mimics the motion of a judo throw, requiring coordination, core strength, and controlled movement.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "0174",
    "imageAssetId": "0174",
    "instructions": [
      "Stand facing the cable machine with your feet shoulder-width apart.",
      "Hold the cable handle with both hands at chest level, palms facing down.",
      "Engage your core and rotate your torso to the right, pulling the cable across your body.",
      "As you rotate, pivot your back foot and allow your hips to rotate naturally.",
      "Extend your arms fully and finish the movement by flipping the cable handle over your shoulder.",
      "Return to the starting position by reversing the movement, rotating your torso back to the center.",
      "Repeat the movement on the opposite side.",
      "Continue alternating sides for the desired number of repetitions."
    ],
    "name": "Cable Judo Flip",
    "secondaryMuscles": [
      "Obliques",
      "Shoulders"
    ],
    "target": "Abs"
  },
  {
    "bodyPart": "waist",
    "category": "strength",
    "description": "The cable kneeling crunch is an abdominal exercise performed using a cable machine with a rope attachment. It targets the abs and also engages the obliques. The movement involves kneeling, holding the rope behind the head, and crunching the torso down towards the thighs.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "0175",
    "imageAssetId": "0175",
    "instructions": [
      "Attach a rope handle to a high pulley and kneel down facing away from the machine.",
      "Hold the rope handle with both hands and place it behind your head, keeping your elbows out to the sides.",
      "Keeping your hips stationary, flex your waist and crunch your torso down towards your thighs.",
      "Pause for a moment at the bottom, then slowly return to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Kneeling Crunch",
    "secondaryMuscles": [
      "Obliques"
    ],
    "target": "Abs"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The cable kneeling rear delt row (with rope) targets the rear deltoids and upper back muscles, requiring the user to kneel and pull a rope attachment toward their body while maintaining a strong core and stable posture.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "3697",
    "imageAssetId": "3697",
    "instructions": [
      "Attach a rope handle to a low cable pulley and kneel down facing the machine.",
      "Grasp the rope with a neutral grip (palms facing each other) and extend your arms fully in front of you.",
      "Keeping your back straight and core engaged, pull the rope towards your body by retracting your shoulder blades.",
      "Squeeze your shoulder blades together at the end of the movement and hold for a brief pause.",
      "Slowly release the tension and return to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Kneeling Rear Delt Row (with Rope) (male)",
    "secondaryMuscles": [
      "Trapezius",
      "Rhomboids",
      "Biceps"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "back",
    "category": "strength",
    "description": "The cable lat pulldown full range of motion is a strength exercise targeting the latissimus dorsi (lats) using a cable machine. It also engages the biceps, rhomboids, and rear deltoids. The movement involves pulling a cable bar down towards the chest while seated, emphasizing a full range of motion for optimal muscle activation.",
    "difficulty": "beginner",
    "equipment": "cable",
    "id": "2330",
    "imageAssetId": "2330",
    "instructions": [
      "Sit on the lat pulldown machine with your knees positioned under the pads.",
      "Grasp the cable bar with an overhand grip, slightly wider than shoulder-width apart.",
      "Lean back slightly and keep your chest up, maintaining a slight arch in your lower back.",
      "Pull the bar down towards your upper chest, squeezing your shoulder blades together.",
      "Pause for a moment at the bottom of the movement, then slowly release the bar back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Lat Pulldown Full Range Of Motion",
    "secondaryMuscles": [
      "Biceps",
      "Rhomboids",
      "Rear Deltoids"
    ],
    "target": "Lats"
  },
  {
    "bodyPart": "back",
    "category": "strength",
    "description": "The cable lateral pulldown (with rope attachment) is a strength exercise targeting the latissimus dorsi (lats) using a cable machine with a rope attachment. It also engages the biceps and forearms as secondary muscles. The movement involves pulling the rope down towards your sides while maintaining proper posture and squeezing the shoulder blades together.",
    "difficulty": "beginner",
    "equipment": "cable",
    "id": "0177",
    "imageAssetId": "0177",
    "instructions": [
      "Attach a rope attachment to the cable machine at a high position.",
      "Stand facing the machine with your feet shoulder-width apart.",
      "Grasp the rope with an overhand grip, palms facing each other.",
      "Keep your back straight and lean slightly back.",
      "Pull the rope down towards your sides, squeezing your shoulder blades together.",
      "Pause for a moment at the bottom of the movement.",
      "Slowly release the tension and allow the rope to return to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Lateral Pulldown (with Rope Attachment)",
    "secondaryMuscles": [
      "Biceps",
      "Forearms"
    ],
    "target": "Lats"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The cable lateral raise is an isolation exercise that targets the deltoid muscles, particularly the lateral (middle) head. It is performed using a cable machine, which provides constant tension throughout the movement. This exercise helps build shoulder width and strength.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "0178",
    "imageAssetId": "0178",
    "instructions": [
      "Stand with your feet shoulder-width apart and grasp the cable handles with an overhand grip.",
      "Keep your arms straight and your core engaged.",
      "Raise your arms out to the sides until they are parallel to the floor.",
      "Pause for a moment at the top, then slowly lower your arms back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Lateral Raise",
    "secondaryMuscles": [
      "Traps",
      "Triceps"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "chest",
    "category": "strength",
    "description": "The cable low fly is an isolation exercise targeting the pectoral muscles using a cable machine. It involves bringing the arms together in front of the body from a low starting position, emphasizing the lower and inner chest.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "0179",
    "imageAssetId": "0179",
    "instructions": [
      "Attach the handles to the low pulleys of a cable machine and select an appropriate weight.",
      "Stand in the middle of the machine with your feet shoulder-width apart and a slight bend in your knees.",
      "Grasp the handles with an overhand grip and extend your arms out to the sides, keeping a slight bend in your elbows.",
      "Maintaining control, slowly bring your arms forward in a sweeping motion, crossing them in front of your body.",
      "Pause for a moment at the peak of the movement, feeling the stretch in your chest muscles.",
      "Reverse the motion and slowly return your arms to the starting position, keeping tension on your chest muscles throughout.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Low Fly",
    "secondaryMuscles": [
      "Deltoids",
      "Triceps"
    ],
    "target": "Pectorals"
  },
  {
    "bodyPart": "back",
    "category": "strength",
    "description": "The cable low seated row is a strength exercise targeting the upper back, performed on a cable machine. It also engages the biceps and forearms as secondary muscles. The movement involves pulling the cable handles toward the torso while maintaining a straight back and squeezing the shoulder blades together.",
    "difficulty": "beginner",
    "equipment": "cable",
    "id": "0180",
    "imageAssetId": "0180",
    "instructions": [
      "Sit on the machine with your feet flat on the footrests and your knees slightly bent.",
      "Grasp the handles with an overhand grip, palms facing down.",
      "Keep your back straight and lean slightly forward, maintaining a slight bend in your elbows.",
      "Pull the handles towards your body, squeezing your shoulder blades together.",
      "Pause for a moment at the peak of the movement, then slowly release the handles back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Low Seated Row",
    "secondaryMuscles": [
      "Biceps",
      "Forearms"
    ],
    "target": "Upper Back"
  },
  {
    "bodyPart": "chest",
    "category": "strength",
    "description": "The cable lying fly is a chest isolation exercise performed on a bench using cable machines. It targets the pectoral muscles and also engages the deltoids and triceps as secondary muscles. The movement involves lowering the arms in a wide arc and then bringing them back together, focusing on squeezing the chest.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "0185",
    "imageAssetId": "0185",
    "instructions": [
      "Attach the handles to the cables and lie flat on a bench with your feet flat on the ground.",
      "Hold the handles with your palms facing each other and your arms extended straight above your chest.",
      "Keeping a slight bend in your elbows, lower your arms out to the sides in a wide arc until you feel a stretch in your chest.",
      "Pause for a moment, then squeeze your chest muscles to bring your arms back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Lying Fly",
    "secondaryMuscles": [
      "Deltoids",
      "Triceps"
    ],
    "target": "Pectorals"
  },
  {
    "bodyPart": "chest",
    "category": "strength",
    "description": "The cable middle fly is an isolation exercise targeting the pectoral muscles using a cable machine. It emphasizes chest development and also engages the deltoids and triceps as secondary muscles.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "0188",
    "imageAssetId": "0188",
    "instructions": [
      "Attach cables to both sides of a cable machine at chest height.",
      "Stand in the center of the machine with one foot slightly in front of the other.",
      "Grasp the handles with an overhand grip and extend your arms out to the sides.",
      "Keep a slight bend in your elbows and maintain a slight forward lean.",
      "Engage your chest muscles and bring your arms forward in a sweeping motion.",
      "Pause for a moment at the center, then slowly return your arms back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Middle Fly",
    "secondaryMuscles": [
      "Deltoids",
      "Triceps"
    ],
    "target": "Pectorals"
  },
  {
    "bodyPart": "chest",
    "category": "strength",
    "description": "The cable one arm incline press is a unilateral chest exercise performed on an incline bench using a cable machine. It targets the pectoral muscles while also engaging the deltoids and triceps. This movement requires stability and coordination as you press the cable handle upward with one arm at a time.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "1265",
    "imageAssetId": "1265",
    "instructions": [
      "Adjust the cable machine to a low pulley position.",
      "Sit on an incline bench facing away from the cable machine.",
      "Grasp the handle with one hand and bring it up to shoulder height.",
      "Position your feet firmly on the ground and maintain a stable position.",
      "Press the handle forward and upward, extending your arm fully.",
      "Pause for a moment at the top, then slowly lower the handle back to the starting position.",
      "Repeat for the desired number of repetitions, then switch sides."
    ],
    "name": "Cable One Arm Incline Press",
    "secondaryMuscles": [
      "Deltoids",
      "Triceps"
    ],
    "target": "Pectorals"
  },
  {
    "bodyPart": "chest",
    "category": "strength",
    "description": "The cable one arm incline press on exercise ball is a unilateral chest exercise performed on an unstable surface, targeting the pectorals while also engaging the shoulders and triceps. The use of the exercise ball increases the demand for balance and core stability.",
    "difficulty": "advanced",
    "equipment": "cable",
    "id": "1266",
    "imageAssetId": "1266",
    "instructions": [
      "Sit on an exercise ball with your feet flat on the ground and your back resting against an incline bench.",
      "Hold a cable handle in one hand and position your arm at a 90-degree angle with your elbow bent.",
      "Press the cable handle forward and upward, extending your arm fully.",
      "Pause for a moment at the top, then slowly lower the cable handle back to the starting position.",
      "Repeat for the desired number of repetitions, then switch to the other arm."
    ],
    "name": "Cable One Arm Incline Press On Exercise Ball",
    "secondaryMuscles": [
      "Shoulders",
      "Triceps"
    ],
    "target": "Pectorals"
  },
  {
    "bodyPart": "chest",
    "category": "strength",
    "description": "The cable one arm lateral bent-over is an isolation exercise targeting the pectoral muscles, performed using a cable machine. It involves extending one arm laterally while bent over, focusing on chest activation with secondary involvement of the deltoids and trapezius.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "0191",
    "imageAssetId": "0191",
    "instructions": [
      "Stand with your feet shoulder-width apart, facing a cable machine.",
      "Grasp the handle with one hand and step back to create tension on the cable.",
      "Bend forward at the waist, keeping your back straight and your core engaged.",
      "Extend your arm out to the side, parallel to the ground, with a slight bend in your elbow.",
      "Slowly bring your arm back to the starting position, maintaining control throughout the movement.",
      "Repeat for the desired number of repetitions, then switch sides."
    ],
    "name": "Cable One Arm Lateral Bent-over",
    "secondaryMuscles": [
      "Deltoids",
      "Trapezius"
    ],
    "target": "Pectorals"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The cable one arm lateral raise is an isolation exercise targeting the deltoid muscles, particularly the lateral (side) head. It is performed using a cable machine, which provides constant tension throughout the movement. This exercise helps build shoulder width and strength.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "0192",
    "imageAssetId": "0192",
    "instructions": [
      "Stand with your feet shoulder-width apart, facing the cable machine.",
      "Hold the cable handle with one hand, palm facing down, and stand far enough away from the machine so that there is tension on the cable.",
      "Keep your arm straight and slowly raise it out to the side until it is parallel to the ground.",
      "Pause for a moment at the top, then slowly lower your arm back down to the starting position.",
      "Repeat for the desired number of repetitions, then switch sides."
    ],
    "name": "Cable One Arm Lateral Raise",
    "secondaryMuscles": [
      "Traps",
      "Triceps"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The cable one arm tricep pushdown is an isolation exercise targeting the triceps using a cable machine. It helps build triceps strength and definition, and also engages the forearms as secondary muscles.",
    "difficulty": "beginner",
    "equipment": "cable",
    "id": "1723",
    "imageAssetId": "1723",
    "instructions": [
      "Stand facing a cable machine with a straight bar attachment at chest height.",
      "Grasp the bar with an overhand grip and step back to create tension in the cable.",
      "Position your feet shoulder-width apart and slightly bend your knees.",
      "Keep your back straight and core engaged throughout the exercise.",
      "Start with your arm fully extended and perpendicular to the floor.",
      "Keeping your upper arm stationary, exhale and push the bar down until your arm is fully extended.",
      "Pause for a moment, then inhale and slowly return to the starting position.",
      "Repeat for the desired number of repetitions, then switch arms."
    ],
    "name": "Cable One Arm Tricep Pushdown",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Triceps"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The cable preacher curl is an isolation exercise targeting the biceps using a cable machine and a preacher curl pad. It emphasizes strict form and constant tension on the biceps throughout the movement.",
    "difficulty": "beginner",
    "equipment": "cable",
    "id": "0195",
    "imageAssetId": "0195",
    "instructions": [
      "Adjust the cable machine so that the preacher curl pad is at chest height.",
      "Sit on the preacher curl bench and place your upper arms on the pad, gripping the cable attachment with an underhand grip.",
      "Keep your back straight and your elbows tucked in at your sides.",
      "Slowly curl the cable attachment up towards your shoulders, squeezing your biceps at the top of the movement.",
      "Pause for a moment, then slowly lower the cable attachment back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Preacher Curl",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Biceps"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The cable pushdown is an isolation exercise targeting the triceps using a cable machine. It is commonly performed to build strength and size in the triceps, with some engagement of the forearms. The movement is controlled and requires proper form to maximize effectiveness and minimize risk of injury.",
    "difficulty": "beginner",
    "equipment": "cable",
    "id": "0201",
    "imageAssetId": "0201",
    "instructions": [
      "Attach a straight bar to a high pulley cable machine.",
      "Stand facing the machine with your feet shoulder-width apart and a slight bend in your knees.",
      "Grasp the bar with an overhand grip, hands shoulder-width apart.",
      "Keep your elbows close to your sides and your upper arms stationary.",
      "Exhale and push the bar down until your elbows are fully extended.",
      "Pause for a moment, then inhale and slowly return the bar to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Pushdown",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Triceps"
  },
  {
    "bodyPart": "back",
    "category": "strength",
    "description": "The cable pushdown (straight arm) v. 2 is an isolation exercise primarily targeting the latissimus dorsi (lats) using a cable machine with a straight bar attachment. It also engages the triceps and shoulders as secondary muscles. The movement requires maintaining straight arms and a stable core throughout the exercise.",
    "difficulty": "beginner",
    "equipment": "cable",
    "id": "0199",
    "imageAssetId": "0199",
    "instructions": [
      "Attach a straight bar to a high pulley cable machine.",
      "Stand facing the machine with your feet shoulder-width apart and a slight bend in your knees.",
      "Grasp the bar with an overhand grip, keeping your arms straight and your palms facing down.",
      "Engage your core and keep your back straight as you exhale and push the bar down towards your thighs.",
      "Pause for a moment at the bottom, then slowly return the bar to the starting position while inhaling.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Pushdown (straight Arm) V. 2",
    "secondaryMuscles": [
      "Triceps",
      "Shoulders"
    ],
    "target": "Lats"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The cable pushdown (with rope attachment) is an isolation exercise targeting the triceps. It is performed using a cable machine with a rope attachment, focusing on extending the elbows to work the triceps while also engaging the forearms as secondary muscles.",
    "difficulty": "beginner",
    "equipment": "cable",
    "id": "0200",
    "imageAssetId": "0200",
    "instructions": [
      "Attach a rope attachment to a high pulley on a cable machine.",
      "Stand facing the machine with your feet shoulder-width apart and a slight bend in your knees.",
      "Grasp the rope with an overhand grip, palms facing each other.",
      "Keep your elbows close to your sides and your upper arms stationary throughout the exercise.",
      "Exhale and push the rope downward by extending your elbows until your arms are fully extended.",
      "Pause for a moment, then inhale and slowly return to the starting position by allowing your elbows to flex.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Pushdown (with Rope Attachment)",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Triceps"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The cable rear delt row (stirrups) is an isolation exercise targeting the rear deltoids, with additional activation of the trapezius, rhomboids, and biceps. It is performed using a cable machine with a stirrup handle, focusing on shoulder retraction and control.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "0202",
    "imageAssetId": "0202",
    "instructions": [
      "Attach a stirrup handle to a low cable pulley and stand facing the machine.",
      "Grasp the handle with your left hand and take a step back with your right foot, positioning your body at a slight angle.",
      "Bend your knees slightly and hinge forward at the hips, keeping your back straight and your core engaged.",
      "With your left arm extended and your palm facing down, pull the handle towards your chest by retracting your shoulder blade.",
      "Pause for a moment at the top of the movement, squeezing your shoulder blade.",
      "Slowly release the handle back to the starting position and repeat for the desired number of repetitions.",
      "Switch sides and repeat the exercise with your right arm."
    ],
    "name": "Cable Rear Delt Row (stirrups)",
    "secondaryMuscles": [
      "Trapezius",
      "Rhomboids",
      "Biceps"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The cable rear delt row (with rope) is an isolation exercise targeting the rear deltoids, with secondary emphasis on the trapezius, rhomboids, and biceps. It uses a cable machine and rope attachment to provide constant tension throughout the movement, helping to develop shoulder strength and stability.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "0203",
    "imageAssetId": "0203",
    "instructions": [
      "Attach a rope handle to a low pulley cable machine.",
      "Stand facing the machine with your feet shoulder-width apart.",
      "Grasp the rope handle with an overhand grip, palms facing each other.",
      "Bend your knees slightly and hinge forward at the hips, keeping your back straight.",
      "Keep your elbows slightly bent and pull the rope towards your chest, squeezing your shoulder blades together.",
      "Pause for a moment at the top of the movement, then slowly release the tension and return to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Rear Delt Row (with Rope)",
    "secondaryMuscles": [
      "Trapezius",
      "Rhomboids",
      "Biceps"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The cable reverse grip triceps pushdown (sz-bar) with arm blaster is an isolation exercise targeting the triceps, using a cable machine and an underhand grip for increased emphasis on the triceps' long head. The arm blaster helps keep the upper arms stationary, improving form and muscle engagement.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "2406",
    "imageAssetId": "2406",
    "instructions": [
      "Attach a straight bar to the cable machine at the highest setting.",
      "Stand facing the cable machine with your feet shoulder-width apart.",
      "Grasp the bar with an underhand grip, palms facing up, and your hands shoulder-width apart.",
      "Keep your elbows close to your sides and your upper arms stationary throughout the exercise.",
      "Engage your triceps and slowly push the bar down until your arms are fully extended.",
      "Pause for a moment at the bottom, then slowly return the bar to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Reverse Grip Triceps Pushdown (sz-bar) (with Arm Blaster)",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Triceps"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The cable reverse preacher curl is an isolation exercise targeting the biceps, performed using a cable machine and a preacher curl bench. It emphasizes the brachialis and forearm muscles due to the reverse (pronated) grip.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "0209",
    "imageAssetId": "0209",
    "instructions": [
      "Adjust the cable machine so that the preacher curl pad is at chest height.",
      "Sit on the preacher curl bench and place your upper arms on the pad, with your palms facing down and your elbows fully extended.",
      "Grab the cable handles with an underhand grip, shoulder-width apart.",
      "Keeping your upper arms stationary, exhale and curl the handles towards your shoulders, contracting your biceps.",
      "Pause for a moment at the top of the movement, squeezing your biceps.",
      "Inhale and slowly lower the handles back to the starting position, fully extending your elbows.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Reverse Preacher Curl",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Biceps"
  },
  {
    "bodyPart": "lower arms",
    "category": "strength",
    "description": "The cable reverse wrist curl is an isolation exercise targeting the forearms, specifically the wrist extensors. It is performed using a cable machine and focuses on strengthening the muscles responsible for wrist extension.",
    "difficulty": "beginner",
    "equipment": "cable",
    "id": "0210",
    "imageAssetId": "0210",
    "instructions": [
      "Attach a cable to a low pulley and sit on a bench facing the cable machine.",
      "Grasp the cable handle with an overhand grip, palms facing down.",
      "Rest your forearms on your thighs, with your wrists hanging off the edge.",
      "Keeping your forearms stationary, exhale and curl your wrists upward as far as possible.",
      "Pause for a moment at the top, then inhale and slowly lower your wrists back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Reverse Wrist Curl",
    "secondaryMuscles": [
      "Forearms",
      "Wrists"
    ],
    "target": "Forearms"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The cable reverse-grip pushdown is an isolation exercise targeting the triceps, performed using a cable machine with a straight bar and an underhand grip. It emphasizes triceps activation while also engaging the forearms.",
    "difficulty": "beginner",
    "equipment": "cable",
    "id": "0207",
    "imageAssetId": "0207",
    "instructions": [
      "Attach a straight bar to a high pulley cable machine.",
      "Stand facing the machine with your feet shoulder-width apart.",
      "Grasp the bar with an underhand grip, palms facing up, and your hands shoulder-width apart.",
      "Keep your elbows close to your sides and your upper arms stationary throughout the exercise.",
      "Using your triceps, push the bar down until your arms are fully extended and your triceps are contracted.",
      "Pause for a moment, then slowly return the bar to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Reverse-grip Pushdown",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Triceps"
  },
  {
    "bodyPart": "waist",
    "category": "strength",
    "description": "Cable Russian Twists (on stability ball) are a core exercise that targets the abs, obliques, and lower back. The use of a stability ball increases the balance and coordination required, while the cable adds resistance for strength development.",
    "difficulty": "advanced",
    "equipment": "cable",
    "id": "0211",
    "imageAssetId": "0211",
    "instructions": [
      "Sit on a stability ball with your feet flat on the ground and your knees bent at a 90-degree angle.",
      "Hold the cable handle with both hands and extend your arms straight out in front of you.",
      "Lean back slightly while keeping your back straight and your core engaged.",
      "Twist your torso to the right, bringing the cable handle towards your right hip.",
      "Pause for a moment, then twist your torso to the left, bringing the cable handle towards your left hip.",
      "Continue alternating twists for the desired number of repetitions."
    ],
    "name": "Cable Russian Twists (on Stability Ball)",
    "secondaryMuscles": [
      "Obliques",
      "Lower Back"
    ],
    "target": "Abs"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The cable seated rear lateral raise is an isolation exercise targeting the rear deltoids, with secondary emphasis on the traps and rhomboids. It is performed seated at a cable machine, raising the arms laterally to shoulder height.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "0215",
    "imageAssetId": "0215",
    "instructions": [
      "Sit on a bench facing the cable machine with your feet flat on the ground.",
      "Grasp the cable handles with an overhand grip and extend your arms straight in front of you.",
      "Keeping your arms straight, slowly raise them out to the sides until they are parallel to the floor.",
      "Pause for a moment at the top, then slowly lower your arms back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Seated Rear Lateral Raise",
    "secondaryMuscles": [
      "Traps",
      "Rhomboids"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "lower arms",
    "category": "strength",
    "description": "The cable standing back wrist curl is an isolation exercise targeting the forearms. It is performed using a cable machine and focuses on strengthening the wrist extensors.",
    "difficulty": "beginner",
    "equipment": "cable",
    "id": "0224",
    "imageAssetId": "0224",
    "instructions": [
      "Stand facing a cable machine with your feet shoulder-width apart.",
      "Hold the cable handle with an overhand grip, palms facing down.",
      "Keep your arms straight and your elbows close to your sides.",
      "Slowly curl your wrists upward, bringing the cable handle towards your body.",
      "Pause for a moment at the top, then slowly lower the cable handle back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Standing Back Wrist Curl",
    "secondaryMuscles": [
      "Biceps",
      "Brachialis"
    ],
    "target": "Forearms"
  },
  {
    "bodyPart": "chest",
    "category": "strength",
    "description": "The cable standing fly is a chest isolation exercise performed using a cable machine. It targets the pectoral muscles and also engages the deltoids and triceps. The movement requires good form, balance, and control to execute safely and effectively.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "0227",
    "imageAssetId": "0227",
    "instructions": [
      "Attach the handles to the cables at chest height.",
      "Stand with your feet shoulder-width apart, facing away from the cable machine.",
      "Grasp the handles with an overhand grip, palms facing forward.",
      "Step forward slightly to create tension in the cables.",
      "Keep your core engaged and your back straight throughout the exercise.",
      "With a slight bend in your elbows, slowly bring your arms forward and together in front of your chest.",
      "Squeeze your chest muscles at the peak of the movement.",
      "Slowly reverse the movement, returning your arms to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Standing Fly",
    "secondaryMuscles": [
      "Deltoids",
      "Triceps"
    ],
    "target": "Pectorals"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The cable standing rear delt row (with rope) targets the rear deltoids and upper back muscles using a cable machine and rope attachment. It requires proper form to effectively engage the shoulders and upper back while maintaining core stability.",
    "difficulty": "intermediate",
    "equipment": "cable",
    "id": "0233",
    "imageAssetId": "0233",
    "instructions": [
      "Stand facing a cable machine with your feet shoulder-width apart.",
      "Hold the cable attachment with both hands, palms facing each other, and step back to create tension in the cable.",
      "Keep your back straight and your core engaged.",
      "Pull the cable towards your body, squeezing your shoulder blades together.",
      "Pause for a moment at the peak of the movement, then slowly release the cable back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Standing Rear Delt Row (with Rope)",
    "secondaryMuscles": [
      "Trapezius",
      "Rhomboids",
      "Biceps"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The cable triceps pushdown (v-bar) is an isolation exercise targeting the triceps using a cable machine and a v-bar attachment. It is commonly performed to build strength and muscle definition in the triceps.",
    "difficulty": "beginner",
    "equipment": "cable",
    "id": "0241",
    "imageAssetId": "0241",
    "instructions": [
      "Attach a v-bar attachment to the cable machine at the highest setting.",
      "Stand facing the cable machine with your feet shoulder-width apart.",
      "Grasp the v-bar with an overhand grip, palms facing down, and your hands shoulder-width apart.",
      "Keep your elbows close to your sides and your upper arms stationary throughout the exercise.",
      "Engage your triceps and exhale as you push the v-bar down until your arms are fully extended.",
      "Pause for a moment at the bottom of the movement, squeezing your triceps.",
      "Inhale as you slowly return the v-bar to the starting position, maintaining control.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Triceps Pushdown (v-bar)",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Triceps"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The cable triceps pushdown (v-bar) with arm blaster is an isolation exercise targeting the triceps, performed using a cable machine and a v-bar attachment. The arm blaster helps keep the upper arms stationary, increasing triceps engagement.",
    "difficulty": "beginner",
    "equipment": "cable",
    "id": "2405",
    "imageAssetId": "2405",
    "instructions": [
      "Attach a v-bar attachment to the cable machine at the highest setting.",
      "Stand facing the cable machine with your feet shoulder-width apart.",
      "Grasp the v-bar with an overhand grip, palms facing down, and your hands shoulder-width apart.",
      "Keep your elbows close to your sides and your upper arms stationary throughout the exercise.",
      "Engage your triceps and exhale as you push the v-bar down until your arms are fully extended.",
      "Pause for a moment at the bottom of the movement, squeezing your triceps.",
      "Inhale as you slowly return the v-bar to the starting position, maintaining control.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Triceps Pushdown (v-bar) (with Arm Blaster)",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Triceps"
  },
  {
    "bodyPart": "lower arms",
    "category": "strength",
    "description": "The cable wrist curl is an isolation exercise targeting the forearm muscles, particularly the wrist flexors. It is performed using a cable machine and a straight bar, focusing on curling the wrists upward while keeping the forearms stationary.",
    "difficulty": "beginner",
    "equipment": "cable",
    "id": "0247",
    "imageAssetId": "0247",
    "instructions": [
      "Attach a straight bar to a low pulley cable machine.",
      "Stand facing the machine with your feet shoulder-width apart.",
      "Grasp the bar with an underhand grip, palms facing up, and your hands shoulder-width apart.",
      "Rest your forearms on a bench or pad, with your wrists hanging off the edge.",
      "Keeping your forearms stationary, exhale and curl your wrists upward as far as possible.",
      "Pause for a moment at the top, then inhale and slowly lower the bar back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Cable Wrist Curl",
    "secondaryMuscles": [
      "Biceps",
      "Brachialis"
    ],
    "target": "Forearms"
  },
  {
    "bodyPart": "lower legs",
    "category": "mobility",
    "description": "The circles knee stretch is a bodyweight exercise that targets the calves and also engages the hamstrings and quadriceps. It involves standing on the balls of your feet with knees bent and rotating the knees in circular motions to improve mobility and flexibility in the lower legs.",
    "difficulty": "beginner",
    "equipment": "body weight",
    "id": "0257",
    "imageAssetId": "0257",
    "instructions": [
      "Stand with your feet shoulder-width apart and your hands on your hips.",
      "Bend your knees slightly and lift your heels off the ground, balancing on the balls of your feet.",
      "Keeping your knees bent, rotate your knees in a circular motion, first clockwise and then counterclockwise.",
      "Perform the movement for the desired number of repetitions."
    ],
    "name": "Circles Knee Stretch",
    "secondaryMuscles": [
      "Hamstrings",
      "Quadriceps"
    ],
    "target": "Calves"
  },
  {
    "bodyPart": "cardio",
    "category": "cardio",
    "description": "The cycle cross trainer is a cardiovascular exercise performed on a leverage machine, targeting the cardiovascular system while also engaging the quadriceps, hamstrings, and glutes. It is performed by pedaling in a smooth and controlled motion, with adjustable resistance for varying intensity.",
    "difficulty": "beginner",
    "equipment": "leverage machine",
    "id": "2331",
    "imageAssetId": "2331",
    "instructions": [
      "Adjust the seat height and position yourself on the cycle cross trainer.",
      "Place your feet on the pedals and grip the handlebars.",
      "Start pedaling in a smooth and controlled motion.",
      "Maintain a steady pace and increase the resistance if desired.",
      "Continue pedaling for the desired duration of your cardio workout."
    ],
    "name": "Cycle Cross Trainer",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Glutes"
    ],
    "target": "Cardiovascular System"
  },
  {
    "bodyPart": "lower legs",
    "category": "strength",
    "description": "The donkey calf raise is a bodyweight exercise that targets the calves. It involves standing with your toes on an elevated surface and raising your heels as high as possible to work the calf muscles.",
    "difficulty": "beginner",
    "equipment": "body weight",
    "id": "0284",
    "imageAssetId": "0284",
    "instructions": [
      "Stand with your toes on an elevated surface, such as a step or block.",
      "Place your hands on a stable support, such as a wall or railing, for balance.",
      "Raise your heels as high as possible, lifting your body weight onto the balls of your feet.",
      "Pause for a moment at the top, then slowly lower your heels back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Donkey Calf Raise",
    "secondaryMuscles": [
      "Hamstrings",
      "Glutes"
    ],
    "target": "Calves"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The dumbbell alternate seated hammer curl is an upper arm exercise that targets the biceps and forearms. It is performed while seated, alternating curls with each arm using a neutral grip.",
    "difficulty": "beginner",
    "equipment": "dumbbell",
    "id": "1648",
    "imageAssetId": "1648",
    "instructions": [
      "Sit on a bench with a dumbbell in each hand, palms facing your torso and arms extended down.",
      "Keep your back straight and your elbows close to your torso.",
      "Exhale and curl the dumbbell in your right hand towards your shoulder, keeping your upper arm stationary.",
      "Continue to raise the dumbbell until your biceps are fully contracted and the dumbbell is at shoulder level.",
      "Pause for a brief moment, then inhale and slowly lower the dumbbell back to the starting position.",
      "Repeat the movement with your left arm.",
      "Continue alternating arms for the desired number of repetitions."
    ],
    "name": "Dumbbell Alternate Seated Hammer Curl",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Biceps"
  },
  {
    "bodyPart": "chest",
    "category": "strength",
    "description": "The dumbbell bench press is a classic upper body strength exercise that targets the pectoral muscles, with secondary emphasis on the triceps and shoulders. It is performed lying on a bench, pressing dumbbells from chest level to full arm extension.",
    "difficulty": "beginner",
    "equipment": "dumbbell",
    "id": "0289",
    "imageAssetId": "0289",
    "instructions": [
      "Lie flat on a bench with your feet flat on the ground and your back pressed against the bench.",
      "Hold a dumbbell in each hand, with your palms facing forward and your arms extended above your chest.",
      "Lower the dumbbells slowly to the sides of your chest, keeping your elbows at a 90-degree angle.",
      "Pause for a moment, then push the dumbbells back up to the starting position, fully extending your arms.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Dumbbell Bench Press",
    "secondaryMuscles": [
      "Triceps",
      "Shoulders"
    ],
    "target": "Pectorals"
  },
  {
    "bodyPart": "cardio",
    "category": "cardio",
    "description": "The dumbbell burpee is a full-body exercise that combines a squat, push-up, and overhead press using dumbbells. It targets the cardiovascular system while also engaging multiple muscle groups, including the legs, shoulders, triceps, and core.",
    "difficulty": "advanced",
    "equipment": "dumbbell",
    "id": "1201",
    "imageAssetId": "1201",
    "instructions": [
      "Start in a standing position with your feet shoulder-width apart and a dumbbell in each hand.",
      "Lower your body into a squat position, placing the dumbbells on the ground in front of you.",
      "Kick your feet back into a push-up position, keeping your body in a straight line.",
      "Perform a push-up, bending your elbows and lowering your chest towards the ground.",
      "Jump your feet back towards your hands, landing in a squat position.",
      "Stand up explosively, lifting the dumbbells off the ground and bringing them to your shoulders.",
      "Press the dumbbells overhead, fully extending your arms.",
      "Lower the dumbbells back to your shoulders and repeat the entire sequence for the desired number of repetitions."
    ],
    "name": "Dumbbell Burpee",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Calves",
      "Shoulders",
      "Triceps",
      "Core"
    ],
    "target": "Cardiovascular System"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The dumbbell cross body hammer curl is an isolation exercise targeting the biceps and forearms, performed by curling dumbbells across the body toward the opposite shoulder.",
    "difficulty": "beginner",
    "equipment": "dumbbell",
    "id": "0298",
    "imageAssetId": "0298",
    "instructions": [
      "Stand up straight with a dumbbell in each hand, palms facing your body.",
      "Keep your elbows close to your torso and your upper arms stationary.",
      "Exhale and curl the weights while contracting your biceps, bringing the dumbbells across your body towards your opposite shoulder.",
      "Continue to raise the dumbbells until your biceps are fully contracted and the dumbbells are at shoulder level.",
      "Hold the contracted position for a brief pause as you squeeze your biceps.",
      "Inhale and slowly begin to lower the dumbbells back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Dumbbell Cross Body Hammer Curl",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Biceps"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The dumbbell cross body hammer curl v. 2 is an upper arm exercise targeting the biceps and forearms. It involves curling a dumbbell across the body toward the opposite shoulder, emphasizing the brachialis and brachioradialis muscles.",
    "difficulty": "beginner",
    "equipment": "dumbbell",
    "id": "1657",
    "imageAssetId": "1657",
    "instructions": [
      "Stand up straight with a dumbbell in each hand, palms facing your body.",
      "Keep your elbows close to your torso and your upper arms stationary.",
      "Exhale and curl the weights while contracting your biceps, bringing the dumbbells as close to your opposite shoulder as possible.",
      "Hold the contracted position for a brief pause as you squeeze your biceps.",
      "Inhale and slowly begin to lower the dumbbells back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Dumbbell Cross Body Hammer Curl V. 2",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Biceps"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The dumbbell full can lateral raise is a shoulder exercise that targets the deltoids and also engages the traps and rotator cuff. It involves raising dumbbells to the sides with a slight bend in the elbows, mimicking the motion of pouring from a can, which helps reduce shoulder impingement risk.",
    "difficulty": "beginner",
    "equipment": "dumbbell",
    "id": "0311",
    "imageAssetId": "0311",
    "instructions": [
      "Stand with your feet shoulder-width apart, holding a dumbbell in each hand with your palms facing your body.",
      "Keep your back straight and engage your core.",
      "Raise your arms out to the sides, keeping a slight bend in your elbows, until they are parallel to the ground.",
      "Pause for a moment at the top, then slowly lower your arms back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Dumbbell Full Can Lateral Raise",
    "secondaryMuscles": [
      "Traps",
      "Rotator Cuff"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The dumbbell hammer curl is a strength exercise targeting the biceps and forearms. It is performed by curling dumbbells with a neutral grip (palms facing each other), which emphasizes the brachialis and brachioradialis muscles.",
    "difficulty": "beginner",
    "equipment": "dumbbell",
    "id": "0313",
    "imageAssetId": "0313",
    "instructions": [
      "Stand up straight with a dumbbell in each hand, palms facing your torso.",
      "Keep your elbows close to your torso and rotate the palms of your hands until they are facing forward.",
      "This will be your starting position.",
      "Now, keeping the upper arms stationary, exhale and curl the weights while contracting your biceps.",
      "Continue to raise the weights until your biceps are fully contracted and the dumbbells are at shoulder level.",
      "Hold the contracted position for a brief pause as you squeeze your biceps.",
      "Then, inhale and slowly begin to lower the dumbbells back to the starting position.",
      "Repeat for the recommended amount of repetitions."
    ],
    "name": "Dumbbell Hammer Curl",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Biceps"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The dumbbell hammer curl on exercise ball is a biceps-focused exercise that also engages the forearms and core due to the instability of the exercise ball. It requires balance and coordination in addition to strength.",
    "difficulty": "intermediate",
    "equipment": "dumbbell, exercise ball",
    "id": "1659",
    "imageAssetId": "1659",
    "instructions": [
      "Sit on an exercise ball with your feet flat on the ground and your back straight.",
      "Hold a dumbbell in each hand with your palms facing your body and your arms fully extended.",
      "Keeping your upper arms stationary, exhale and curl the dumbbells while contracting your biceps.",
      "Continue to raise the dumbbells until your biceps are fully contracted and the dumbbells are at shoulder level.",
      "Hold the contracted position for a brief pause as you squeeze your biceps.",
      "Inhale and slowly begin to lower the dumbbells back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Dumbbell Hammer Curl On Exercise Ball",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Biceps"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The dumbbell hammer curl v. 2 is a biceps-focused exercise performed with dumbbells, emphasizing the brachialis and forearm muscles. It is performed standing, with palms facing the torso, and involves curling the weights while keeping the upper arms stationary.",
    "difficulty": "beginner",
    "equipment": "dumbbell",
    "id": "0312",
    "imageAssetId": "0312",
    "instructions": [
      "Stand up straight with a dumbbell in each hand, palms facing your torso.",
      "Keep your elbows close to your torso and rotate the palms of your hands until they are facing forward.",
      "This will be your starting position.",
      "Now, keeping the upper arms stationary, exhale and curl the weights while contracting your biceps.",
      "Continue to raise the weights until your biceps are fully contracted and the dumbbells are at shoulder level.",
      "Hold the contracted position for a brief pause as you squeeze your biceps.",
      "Then, inhale and slowly begin to lower the dumbbells back to the starting position.",
      "Repeat for the recommended amount of repetitions."
    ],
    "name": "Dumbbell Hammer Curl V. 2",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Biceps"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The dumbbell incline hammer curl is an upper arm exercise that targets the biceps and also works the forearms. It is performed while sitting on an incline bench, which increases the stretch on the biceps and challenges the muscles through a greater range of motion.",
    "difficulty": "intermediate",
    "equipment": "dumbbell",
    "id": "0320",
    "imageAssetId": "0320",
    "instructions": [
      "Sit on an incline bench with a dumbbell in each hand, palms facing your torso and arms fully extended.",
      "Keep your back against the bench and your feet flat on the floor.",
      "While keeping your upper arms stationary, exhale and curl the weights while contracting your biceps.",
      "Continue to raise the weights until your biceps are fully contracted and the dumbbells are at shoulder level.",
      "Hold the contracted position for a brief pause as you squeeze your biceps.",
      "Inhale and slowly begin to lower the dumbbells back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Dumbbell Incline Hammer Curl",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Biceps"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The dumbbell incline one arm lateral raise is a shoulder isolation exercise performed on an incline bench. It targets the deltoid muscles and helps improve shoulder strength and stability.",
    "difficulty": "intermediate",
    "equipment": "dumbbell",
    "id": "0323",
    "imageAssetId": "0323",
    "instructions": [
      "Sit on an incline bench with a dumbbell in one hand, resting it on your thigh.",
      "Lean forward and position your upper arm against the inside of your thigh.",
      "Raise the dumbbell to the side, keeping your arm slightly bent and your palm facing down.",
      "Continue lifting until your arm is parallel to the floor.",
      "Pause for a moment at the top, then slowly lower the dumbbell back to the starting position.",
      "Repeat for the desired number of repetitions, then switch to the other arm."
    ],
    "name": "Dumbbell Incline One Arm Lateral Raise",
    "secondaryMuscles": [
      "Trapezius",
      "Triceps"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "chest",
    "category": "strength",
    "description": "The dumbbell incline press on exercise ball is a chest exercise that also engages the shoulders and triceps. Performing this movement on an exercise ball increases the demand for balance and core stability compared to a traditional incline press on a bench.",
    "difficulty": "intermediate",
    "equipment": "dumbbell, exercise ball",
    "id": "1283",
    "imageAssetId": "1283",
    "instructions": [
      "Sit on an exercise ball with a dumbbell in each hand, palms facing forward.",
      "Slowly walk your feet forward, rolling your body down the ball until your head, neck, and upper back are supported on the ball.",
      "Hold the dumbbells at shoulder level, elbows bent and pointing out to the sides.",
      "Press the dumbbells upward, extending your arms fully.",
      "Pause for a moment at the top, then slowly lower the dumbbells back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Dumbbell Incline Press On Exercise Ball",
    "secondaryMuscles": [
      "Shoulders",
      "Triceps"
    ],
    "target": "Pectorals"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The dumbbell incline rear lateral raise targets the rear deltoids with secondary emphasis on the traps and rhomboids. It is performed on an incline bench to isolate the rear shoulder muscles.",
    "difficulty": "intermediate",
    "equipment": "dumbbell",
    "id": "0326",
    "imageAssetId": "0326",
    "instructions": [
      "Set up an incline bench at a 45-degree angle.",
      "Sit on the bench with your chest against the backrest and hold a dumbbell in each hand.",
      "Extend your arms straight down with your palms facing each other.",
      "Keeping a slight bend in your elbows, raise your arms out to the sides until they are parallel to the ground.",
      "Pause for a moment at the top, then slowly lower your arms back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Dumbbell Incline Rear Lateral Raise",
    "secondaryMuscles": [
      "Traps",
      "Rhomboids"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The dumbbell lateral raise is an isolation exercise that targets the deltoid muscles, particularly the lateral (side) head. It is commonly used to build shoulder width and strength.",
    "difficulty": "beginner",
    "equipment": "dumbbell",
    "id": "0334",
    "imageAssetId": "0334",
    "instructions": [
      "Stand with your feet shoulder-width apart and hold a dumbbell in each hand, palms facing your body.",
      "Keep your back straight and engage your core.",
      "Raise your arms out to the sides until they are parallel to the floor, keeping a slight bend in your elbows.",
      "Pause for a moment at the top, then slowly lower your arms back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Dumbbell Lateral Raise",
    "secondaryMuscles": [
      "Traps"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The dumbbell lying one arm rear lateral raise is an isolation exercise targeting the rear deltoids, performed lying face down on a bench. It helps develop shoulder strength and stability, with additional engagement of the traps and rhomboids.",
    "difficulty": "intermediate",
    "equipment": "dumbbell",
    "id": "0345",
    "imageAssetId": "0345",
    "instructions": [
      "Lie face down on a flat bench with a dumbbell in one hand, hanging towards the floor.",
      "Keep your arm straight and lift the dumbbell out to the side, away from your body.",
      "Pause for a moment at the top, then slowly lower the dumbbell back down to the starting position.",
      "Repeat for the desired number of repetitions, then switch to the other arm."
    ],
    "name": "Dumbbell Lying One Arm Rear Lateral Raise",
    "secondaryMuscles": [
      "Traps",
      "Rhomboids"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "lower arms",
    "category": "strength",
    "description": "The dumbbell lying pronation is an exercise targeting the forearms, specifically focusing on pronation strength. It is performed lying face down on a bench, holding dumbbells, and rotating the wrists to work the forearm muscles.",
    "difficulty": "beginner",
    "equipment": "dumbbell",
    "id": "0347",
    "imageAssetId": "0347",
    "instructions": [
      "Lie flat on a bench with your chest facing down and your arms extended straight down, holding a dumbbell in each hand.",
      "Rotate your palms so they are facing up.",
      "Keeping your upper arms stationary, exhale and curl the dumbbells as you rotate your palms to face down.",
      "Inhale and slowly lower the dumbbells back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Dumbbell Lying Pronation",
    "secondaryMuscles": [
      "Biceps",
      "Shoulders"
    ],
    "target": "Forearms"
  },
  {
    "bodyPart": "back",
    "category": "strength",
    "description": "The dumbbell lying rear delt row targets the upper back and rear deltoids, performed while lying face down on a bench and rowing dumbbells upward.",
    "difficulty": "intermediate",
    "equipment": "dumbbell",
    "id": "1328",
    "imageAssetId": "1328",
    "instructions": [
      "Lie face down on a flat bench with a dumbbell in each hand, palms facing inwards.",
      "Extend your arms straight down towards the floor, keeping a slight bend in your elbows.",
      "Engaging your back muscles, lift the dumbbells up towards your chest, squeezing your shoulder blades together.",
      "Pause for a moment at the top, then slowly lower the dumbbells back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Dumbbell Lying Rear Delt Row",
    "secondaryMuscles": [
      "Shoulders",
      "Biceps"
    ],
    "target": "Upper Back"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The dumbbell lying rear lateral raise is an isolation exercise targeting the rear deltoids, performed lying face down on a bench to minimize momentum and maximize shoulder engagement.",
    "difficulty": "intermediate",
    "equipment": "dumbbell",
    "id": "0348",
    "imageAssetId": "0348",
    "instructions": [
      "Lie face down on a flat bench with a dumbbell in each hand, palms facing each other.",
      "Extend your arms straight down towards the floor, keeping a slight bend in your elbows.",
      "Engaging your shoulder muscles, lift your arms out to the sides until they are parallel to the floor.",
      "Pause for a moment at the top, then slowly lower your arms back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Dumbbell Lying Rear Lateral Raise",
    "secondaryMuscles": [
      "Traps",
      "Rhomboids"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "lower arms",
    "category": "strength",
    "description": "The dumbbell lying supination is an isolation exercise targeting the forearms, specifically focusing on the supinator muscles. It also engages the biceps and shoulders as secondary muscles. The movement involves curling dumbbells while lying on a bench, emphasizing forearm rotation and strength.",
    "difficulty": "beginner",
    "equipment": "dumbbell",
    "id": "0349",
    "imageAssetId": "0349",
    "instructions": [
      "Lie flat on a bench with your feet flat on the ground.",
      "Hold a dumbbell in each hand with your palms facing up and your arms fully extended.",
      "Keeping your upper arms stationary, curl the dumbbells towards your shoulders by contracting your forearms.",
      "Pause for a moment at the top, then slowly lower the dumbbells back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Dumbbell Lying Supination",
    "secondaryMuscles": [
      "Biceps",
      "Shoulders"
    ],
    "target": "Forearms"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The dumbbell one arm lateral raise is an isolation exercise targeting the deltoid muscles, particularly the lateral (side) head. It also engages the trapezius and triceps as secondary muscles. This exercise helps build shoulder strength and definition, and is commonly used in strength training routines.",
    "difficulty": "beginner",
    "equipment": "dumbbell",
    "id": "0355",
    "imageAssetId": "0355",
    "instructions": [
      "Stand with your feet shoulder-width apart, holding a dumbbell in one hand with your palm facing your body.",
      "Keep your back straight and your core engaged throughout the exercise.",
      "Raise the dumbbell to the side, keeping your arm straight and your palm facing down.",
      "Continue lifting until your arm is parallel to the ground.",
      "Pause for a moment at the top, then slowly lower the dumbbell back to the starting position.",
      "Repeat for the desired number of repetitions, then switch to the other arm."
    ],
    "name": "Dumbbell One Arm Lateral Raise",
    "secondaryMuscles": [
      "Trapezius",
      "Triceps"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "lower arms",
    "category": "strength",
    "description": "The dumbbell one arm reverse wrist curl targets the forearms and wrist extensors by requiring the lifter to curl a dumbbell upward using only the wrist, with the forearm supported on the thigh. This exercise helps build forearm strength and endurance.",
    "difficulty": "beginner",
    "equipment": "dumbbell",
    "id": "0358",
    "imageAssetId": "0358",
    "instructions": [
      "Sit on a bench or chair with your feet flat on the ground.",
      "Hold a dumbbell in one hand with an overhand grip, palm facing down.",
      "Rest your forearm on your thigh, with your wrist hanging off the edge.",
      "Slowly lower the dumbbell towards the ground by flexing your wrist.",
      "Pause for a moment at the bottom, then slowly curl your wrist back up towards your body.",
      "Repeat for the desired number of repetitions, then switch to the other arm."
    ],
    "name": "Dumbbell One Arm Reverse Wrist Curl",
    "secondaryMuscles": [
      "Wrist Extensors"
    ],
    "target": "Forearms"
  },
  {
    "bodyPart": "lower arms",
    "category": "strength",
    "description": "The dumbbell one arm wrist curl is an isolation exercise targeting the forearm muscles, particularly the wrist flexors. It is performed seated, with the forearm supported and the wrist curling a dumbbell upward.",
    "difficulty": "beginner",
    "equipment": "dumbbell",
    "id": "0364",
    "imageAssetId": "0364",
    "instructions": [
      "Sit on a bench or chair with your feet flat on the ground.",
      "Hold a dumbbell in one hand with an underhand grip, resting your forearm on your thigh.",
      "Allow your wrist to extend, letting the dumbbell roll down towards your fingers.",
      "Slowly curl your wrist back up, bringing the dumbbell towards your forearm.",
      "Repeat for the desired number of repetitions, then switch to the other hand."
    ],
    "name": "Dumbbell One Arm Wrist Curl",
    "secondaryMuscles": [
      "Biceps",
      "Brachialis"
    ],
    "target": "Forearms"
  },
  {
    "bodyPart": "lower arms",
    "category": "strength",
    "description": "The dumbbell over bench one arm wrist curl is an isolation exercise targeting the forearm muscles. It is performed seated, with the forearm resting on a bench and the wrist curling a dumbbell upward.",
    "difficulty": "beginner",
    "equipment": "dumbbell",
    "id": "0367",
    "imageAssetId": "0367",
    "instructions": [
      "Sit on a bench with your feet flat on the ground and hold a dumbbell in one hand, palm facing down.",
      "Rest your forearm on the bench with your wrist hanging off the edge.",
      "Slowly curl your wrist upwards, bringing the dumbbell towards your forearm.",
      "Pause for a moment at the top, then slowly lower the dumbbell back down to the starting position.",
      "Repeat for the desired number of repetitions, then switch to the other arm."
    ],
    "name": "Dumbbell Over Bench One Arm Wrist Curl",
    "secondaryMuscles": [
      "Biceps",
      "Shoulders"
    ],
    "target": "Forearms"
  },
  {
    "bodyPart": "lower arms",
    "category": "strength",
    "description": "The dumbbell over bench reverse wrist curl is an isolation exercise targeting the forearms, specifically the wrist extensors. It is performed seated with the forearms resting on a bench and the wrists hanging off the edge, curling the dumbbells upward with the backs of the hands facing up.",
    "difficulty": "beginner",
    "equipment": "dumbbell",
    "id": "0368",
    "imageAssetId": "0368",
    "instructions": [
      "Sit on a bench with your feet flat on the ground and hold a dumbbell in each hand, palms facing down.",
      "Rest your forearms on the bench, allowing your wrists to hang off the edge.",
      "Slowly curl your wrists upward, bringing the dumbbells towards your body.",
      "Pause for a moment at the top, then slowly lower the dumbbells back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Dumbbell Over Bench Reverse Wrist Curl",
    "secondaryMuscles": [
      "Biceps",
      "Brachialis"
    ],
    "target": "Forearms"
  },
  {
    "bodyPart": "lower arms",
    "category": "strength",
    "description": "The dumbbell over bench wrist curl is an isolation exercise targeting the forearms. It is performed by sitting on a bench with your forearms resting on the bench, palms up, and curling your wrists upward with dumbbells.",
    "difficulty": "beginner",
    "equipment": "dumbbell",
    "id": "0369",
    "imageAssetId": "0369",
    "instructions": [
      "Sit on a bench with your forearms resting on the bench and your palms facing up, holding a dumbbell in each hand.",
      "Allow your wrists to hang over the edge of the bench.",
      "Slowly curl your wrists upward, squeezing your forearms at the top of the movement.",
      "Pause for a moment, then slowly lower your wrists back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Dumbbell Over Bench Wrist Curl",
    "secondaryMuscles": [
      "Biceps",
      "Brachialis"
    ],
    "target": "Forearms"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The dumbbell preacher curl is an isolation exercise targeting the biceps, performed on a preacher bench to minimize shoulder involvement and maximize biceps engagement.",
    "difficulty": "beginner",
    "equipment": "dumbbell",
    "id": "0372",
    "imageAssetId": "0372",
    "instructions": [
      "Sit on a preacher curl bench with your upper arms resting on the pad and your chest against it.",
      "Hold a dumbbell in each hand with your palms facing up and your arms fully extended.",
      "Keeping your upper arms stationary, exhale and curl the weights while contracting your biceps.",
      "Continue to raise the dumbbells until your biceps are fully contracted and the dumbbells are at shoulder level.",
      "Hold the contracted position for a brief pause as you squeeze your biceps.",
      "Inhale and slowly begin to lower the dumbbells back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Dumbbell Preacher Curl",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Biceps"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The dumbbell preacher hammer curl is an isolation exercise targeting the biceps and forearms. It is performed with dumbbells while keeping the upper arms stationary, focusing on strict form to maximize biceps engagement.",
    "difficulty": "beginner",
    "equipment": "dumbbell",
    "id": "0370",
    "imageAssetId": "0370",
    "instructions": [
      "Stand up straight with a dumbbell in each hand, palms facing your torso.",
      "Keep your elbows close to your torso and rotate the palms of your hands until they are facing forward.",
      "This will be your starting position.",
      "Now, keeping the upper arms stationary, exhale and curl the weights while contracting your biceps.",
      "Continue to raise the weights until your biceps are fully contracted and the dumbbells are at shoulder level.",
      "Hold the contracted position for a brief pause as you squeeze your biceps.",
      "Then, inhale and slowly begin to lower the dumbbells back to the starting position.",
      "Repeat for the recommended amount of repetitions."
    ],
    "name": "Dumbbell Preacher Hammer Curl",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Biceps"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The dumbbell rear delt row (shoulder) is an exercise targeting the rear deltoids, as well as the trapezius and rhomboids. It involves a bent-over position and rowing motion to strengthen the upper back and shoulders.",
    "difficulty": "intermediate",
    "equipment": "dumbbell",
    "id": "0377",
    "imageAssetId": "0377",
    "instructions": [
      "Stand with your feet shoulder-width apart and knees slightly bent.",
      "Hold a dumbbell in each hand with your palms facing your body.",
      "Bend forward at the waist, keeping your back straight and your core engaged.",
      "Extend your arms straight down towards the floor, with a slight bend in your elbows.",
      "Raise the dumbbells out to the sides, squeezing your shoulder blades together.",
      "Pause for a moment at the top, then slowly lower the dumbbells back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Dumbbell Rear Delt Row (shoulder)",
    "secondaryMuscles": [
      "Trapezius",
      "Rhomboids"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The dumbbell reverse preacher curl is an isolation exercise targeting the biceps and forearms. It is performed seated on a preacher bench, with the upper arms resting on the pad and dumbbells held in an underhand grip. The movement involves curling the dumbbells upward while keeping the upper arms stationary, emphasizing the biceps and forearm muscles.",
    "difficulty": "intermediate",
    "equipment": "dumbbell",
    "id": "0384",
    "imageAssetId": "0384",
    "instructions": [
      "Sit on a preacher bench with your upper arms resting on the pad and your chest against the support.",
      "Hold a dumbbell in each hand with an underhand grip, palms facing up.",
      "Keeping your upper arms stationary, exhale and curl the dumbbells as you contract your biceps.",
      "Continue to curl the dumbbells until your biceps are fully contracted and the dumbbells are at shoulder level.",
      "Hold the contracted position for a brief pause as you squeeze your biceps.",
      "Inhale and slowly lower the dumbbells back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Dumbbell Reverse Preacher Curl",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Biceps"
  },
  {
    "bodyPart": "lower arms",
    "category": "strength",
    "description": "The dumbbell reverse wrist curl is an isolation exercise targeting the forearms, specifically the extensor muscles. It is performed seated, with the forearms resting on the thighs and the wrists curling the dumbbells upward using an overhand grip.",
    "difficulty": "beginner",
    "equipment": "dumbbell",
    "id": "0385",
    "imageAssetId": "0385",
    "instructions": [
      "Sit on a bench or chair with your feet flat on the ground.",
      "Hold a dumbbell in each hand with an overhand grip, palms facing down.",
      "Rest your forearms on your thighs, allowing your wrists to hang off the edge.",
      "Slowly curl your wrists upward, bringing the dumbbells towards your body.",
      "Pause for a moment at the top, then slowly lower the dumbbells back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Dumbbell Reverse Wrist Curl",
    "secondaryMuscles": [
      "Biceps",
      "Brachialis"
    ],
    "target": "Forearms"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The dumbbell Romanian deadlift is a strength exercise targeting the glutes, hamstrings, and lower back. It involves hinging at the hips while holding dumbbells, emphasizing posterior chain development and hip hinge mechanics.",
    "difficulty": "intermediate",
    "equipment": "dumbbell",
    "id": "1459",
    "imageAssetId": "1459",
    "instructions": [
      "Stand with your feet shoulder-width apart, holding a dumbbell in each hand with an overhand grip.",
      "Keeping your back straight and your core engaged, hinge at the hips and lower the dumbbells towards the ground, allowing your knees to bend slightly.",
      "Lower the dumbbells until you feel a stretch in your hamstrings, then push through your heels and engage your glutes to return to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Dumbbell Romanian Deadlift",
    "secondaryMuscles": [
      "Hamstrings",
      "Lower Back"
    ],
    "target": "Glutes"
  },
  {
    "bodyPart": "lower arms",
    "category": "strength",
    "description": "The dumbbell seated one arm rotate is an isolation exercise targeting the forearms, with secondary emphasis on the shoulders and biceps. It involves rotating the forearm outward while keeping the upper arm stationary, helping to improve forearm strength and mobility.",
    "difficulty": "beginner",
    "equipment": "dumbbell",
    "id": "0399",
    "imageAssetId": "0399",
    "instructions": [
      "Sit on a bench with your back straight and hold a dumbbell in one hand, resting it on your thigh.",
      "Raise the dumbbell up to shoulder height, keeping your elbow close to your body.",
      "Rotate your forearm outward, away from your body, while keeping your upper arm stationary.",
      "Pause for a moment at the top, then slowly rotate your forearm back to the starting position.",
      "Repeat for the desired number of repetitions, then switch to the other arm."
    ],
    "name": "Dumbbell Seated One Arm Rotate",
    "secondaryMuscles": [
      "Shoulders",
      "Biceps"
    ],
    "target": "Forearms"
  },
  {
    "bodyPart": "lower legs",
    "category": "strength",
    "description": "The dumbbell seated one leg calf raise is an isolation exercise targeting the calf muscles, performed while seated with a dumbbell placed on the working thigh. It helps build strength and muscle in the calves, with some engagement of the hamstrings and glutes for stabilization.",
    "difficulty": "beginner",
    "equipment": "dumbbell",
    "id": "0400",
    "imageAssetId": "0400",
    "instructions": [
      "Sit on a bench or chair with your feet flat on the ground and a dumbbell resting on your right thigh.",
      "Extend your left leg straight out in front of you, keeping your foot flexed.",
      "Place the ball of your right foot on an elevated surface, such as a step or weight plate.",
      "Using your calf muscles, raise your right heel as high as possible.",
      "Pause for a moment at the top, then slowly lower your heel back down to the starting position.",
      "Repeat for the desired number of repetitions, then switch legs."
    ],
    "name": "Dumbbell Seated One Leg Calf Raise",
    "secondaryMuscles": [
      "Hamstrings",
      "Glutes"
    ],
    "target": "Calves"
  },
  {
    "bodyPart": "lower arms",
    "category": "strength",
    "description": "The dumbbell seated palms up wrist curl is an isolation exercise targeting the forearm muscles, specifically the wrist flexors. It is performed seated, with the forearms resting on the thighs and the wrists curling the dumbbells upward.",
    "difficulty": "beginner",
    "equipment": "dumbbell",
    "id": "0401",
    "imageAssetId": "0401",
    "instructions": [
      "Sit on a bench with your feet flat on the ground and hold a dumbbell in each hand, palms facing up.",
      "Rest your forearms on your thighs, allowing your wrists to hang off the edge.",
      "Slowly curl your wrists upward, squeezing your forearms at the top of the movement.",
      "Pause for a moment, then lower your wrists back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Dumbbell Seated Palms Up Wrist Curl",
    "secondaryMuscles": [
      "Biceps",
      "Shoulders"
    ],
    "target": "Forearms"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The dumbbell seated preacher curl is an isolation exercise targeting the biceps, performed while seated on a preacher bench to minimize momentum and maximize biceps engagement.",
    "difficulty": "beginner",
    "equipment": "dumbbell",
    "id": "0402",
    "imageAssetId": "0402",
    "instructions": [
      "Sit on a preacher curl bench with your feet flat on the floor.",
      "Hold a dumbbell in one hand with an underhand grip, resting your upper arm against the preacher pad.",
      "Keeping your upper arm stationary, exhale and curl the dumbbell up towards your shoulder.",
      "Pause for a moment at the top, then inhale and slowly lower the dumbbell back down to the starting position.",
      "Repeat for the desired number of repetitions, then switch arms."
    ],
    "name": "Dumbbell Seated Preacher Curl",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Biceps"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The dumbbell seated shoulder press is a strength exercise targeting the deltoid muscles of the shoulders. It is performed while seated, pressing dumbbells overhead to build shoulder and upper arm strength.",
    "difficulty": "beginner",
    "equipment": "dumbbell",
    "id": "0405",
    "imageAssetId": "0405",
    "instructions": [
      "Sit on a bench with a dumbbell in each hand, resting on your thighs.",
      "Raise the dumbbells to shoulder height, palms facing forward.",
      "Press the dumbbells upward until your arms are fully extended overhead.",
      "Pause for a moment at the top, then slowly lower the dumbbells back to shoulder height.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Dumbbell Seated Shoulder Press",
    "secondaryMuscles": [
      "Triceps",
      "Upper Back"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The dumbbell seated shoulder press (parallel grip) is a strength exercise targeting the deltoids, performed while seated with dumbbells held in a neutral grip. It also engages the triceps and upper back as secondary muscles.",
    "difficulty": "beginner",
    "equipment": "dumbbell",
    "id": "0404",
    "imageAssetId": "0404",
    "instructions": [
      "Sit on a bench with a dumbbell in each hand, palms facing inward.",
      "Raise the dumbbells to shoulder height, elbows bent and palms facing forward.",
      "Press the dumbbells upward until your arms are fully extended overhead.",
      "Pause for a moment at the top, then slowly lower the dumbbells back to shoulder height.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Dumbbell Seated Shoulder Press (parallel Grip)",
    "secondaryMuscles": [
      "Triceps",
      "Upper Back"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "lower legs",
    "category": "strength",
    "description": "The dumbbell single leg calf raise is a unilateral lower leg exercise that targets the calves, performed while holding a dumbbell for added resistance. It challenges balance and strength by isolating one leg at a time.",
    "difficulty": "intermediate",
    "equipment": "dumbbell",
    "id": "0409",
    "imageAssetId": "0409",
    "instructions": [
      "Stand on the edge of a step or platform with your heels hanging off and your toes on the step.",
      "Hold a dumbbell in one hand and place your other hand on a wall or railing for support.",
      "Raise your heel as high as possible, lifting your body up onto your toes.",
      "Pause for a moment at the top, then slowly lower your heel back down below the step.",
      "Repeat for the desired number of repetitions, then switch to the other leg."
    ],
    "name": "Dumbbell Single Leg Calf Raise",
    "secondaryMuscles": [
      "Ankles"
    ],
    "target": "Calves"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The dumbbell single leg split squat is a unilateral lower body exercise that targets the quadriceps, with secondary emphasis on the glutes, hamstrings, and calves. It requires balance, coordination, and strength, as one leg is elevated and the movement is performed with added resistance from dumbbells.",
    "difficulty": "intermediate",
    "equipment": "dumbbell",
    "id": "0410",
    "imageAssetId": "0410",
    "instructions": [
      "Stand with your feet shoulder-width apart, holding a dumbbell in each hand.",
      "Take a step forward with one foot and position your feet so that your front foot is flat on the ground and your back foot is elevated on a bench or step.",
      "Lower your body by bending your front knee and hip, keeping your back knee slightly bent and your back heel off the ground.",
      "Continue lowering until your front thigh is parallel to the ground, then push through your front heel to return to the starting position.",
      "Repeat for the desired number of repetitions, then switch legs and repeat."
    ],
    "name": "Dumbbell Single Leg Split Squat",
    "secondaryMuscles": [
      "Glutes",
      "Hamstrings",
      "Calves"
    ],
    "target": "Quads"
  },
  {
    "bodyPart": "lower legs",
    "category": "strength",
    "description": "The dumbbell standing calf raise is an exercise that targets the calf muscles by lifting the heels off the ground while holding dumbbells for added resistance.",
    "difficulty": "beginner",
    "equipment": "dumbbell",
    "id": "0417",
    "imageAssetId": "0417",
    "instructions": [
      "Stand with your feet shoulder-width apart, holding a dumbbell in each hand.",
      "Raise your heels off the ground as high as possible, using your calves.",
      "Pause for a moment at the top, then slowly lower your heels back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Dumbbell Standing Calf Raise",
    "secondaryMuscles": [
      "Ankles"
    ],
    "target": "Calves"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The dumbbell standing preacher curl is an isolation exercise targeting the biceps, performed while standing and bracing the upper arms against a preacher or incline bench for strict form.",
    "difficulty": "intermediate",
    "equipment": "dumbbell",
    "id": "0428",
    "imageAssetId": "0428",
    "instructions": [
      "Stand upright with your feet shoulder-width apart and hold a dumbbell in each hand, palms facing forward.",
      "Rest the back of your upper arms against the preacher bench or an incline bench, with your elbows slightly bent.",
      "Keeping your upper arms stationary, exhale and curl the weights while contracting your biceps.",
      "Continue to raise the dumbbells until your biceps are fully contracted and the dumbbells are at shoulder level.",
      "Hold the contracted position for a brief pause as you squeeze your biceps.",
      "Inhale and slowly begin to lower the dumbbells back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Dumbbell Standing Preacher Curl",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Biceps"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "This exercise targets the glutes and also works the hamstrings and calves. It requires balance and coordination as you perform a single-leg hamstring curl and diagonal kick on a stability ball.",
    "difficulty": "advanced",
    "equipment": "stability ball",
    "id": "1417",
    "imageAssetId": "1417",
    "instructions": [
      "Start by lying on your back with your legs extended and your heels resting on top of the stability ball.",
      "Place your arms by your sides for stability.",
      "Engage your glutes and core muscles to lift your hips off the ground, creating a straight line from your shoulders to your heels.",
      "Bend your right knee and bring it towards your chest, keeping your left leg extended and your foot flexed.",
      "Kick your right leg diagonally across your body, extending it fully and engaging your hamstrings.",
      "Slowly return your right leg to the starting position, maintaining control and stability.",
      "Repeat the movement with your left leg, alternating sides for the desired number of repetitions."
    ],
    "name": "Exercise Ball One Legged Diagonal Kick Hamstring Curl",
    "secondaryMuscles": [
      "Hamstrings",
      "Calves"
    ],
    "target": "Glutes"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The EZ barbell reverse grip preacher curl is an isolation exercise targeting the biceps, with additional activation of the forearms. It is performed seated on a preacher bench, using an EZ barbell with a reverse (underhand) grip.",
    "difficulty": "intermediate",
    "equipment": "ez barbell",
    "id": "0452",
    "imageAssetId": "0452",
    "instructions": [
      "Sit on a preacher bench with your chest against the pad and your feet flat on the floor.",
      "Grasp the ez barbell with an underhand grip, hands shoulder-width apart.",
      "Rest your upper arms on the pad, allowing your forearms to hang down.",
      "Keeping your upper arms stationary, exhale and curl the barbell up towards your shoulders.",
      "Pause for a moment at the top, then inhale and slowly lower the barbell back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Ez Barbell Reverse Grip Preacher Curl",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Biceps"
  },
  {
    "bodyPart": "lower arms",
    "category": "strength",
    "description": "Finger curls are an isolation exercise targeting the forearms, specifically the finger flexors and grip muscles. This movement helps improve grip strength and forearm development.",
    "difficulty": "beginner",
    "equipment": "barbell",
    "id": "0455",
    "imageAssetId": "0455",
    "instructions": [
      "Sit on a bench with your feet flat on the ground and hold a barbell with an underhand grip, palms facing up.",
      "Rest your forearms on your thighs, allowing your wrists to hang off the edge.",
      "Slowly curl your fingers towards your palms, squeezing the barbell tightly.",
      "Hold the contraction for a moment, then slowly release your fingers back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Finger Curls",
    "secondaryMuscles": [
      "Wrist Flexors",
      "Grip Muscles"
    ],
    "target": "Forearms"
  },
  {
    "bodyPart": "cardio",
    "category": "cardio",
    "description": "Half knee bends (male) are a bodyweight exercise that primarily targets the cardiovascular system while also engaging the quadriceps, hamstrings, and glutes. The movement involves bending the knees and lowering the body as if sitting back into a chair, then returning to standing. This exercise is often used for light cardio, warm-ups, or rehabilitation.",
    "difficulty": "beginner",
    "equipment": "body weight",
    "id": "3221",
    "imageAssetId": "3221",
    "instructions": [
      "Stand with your feet shoulder-width apart.",
      "Bend your knees and lower your body down as if you were sitting back into a chair.",
      "Keep your chest up and your weight in your heels.",
      "Pause for a moment at the bottom, then push through your heels to return to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Half Knee Bends (male)",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Glutes"
    ],
    "target": "Cardiovascular System"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The inverse leg curl (bench support) is a bodyweight exercise targeting the hamstrings, performed lying face down on a bench while curling the legs toward the glutes.",
    "difficulty": "intermediate",
    "equipment": "body weight",
    "id": "0496",
    "imageAssetId": "0496",
    "instructions": [
      "Lie face down on a bench with your hips at the edge and your legs extended straight behind you.",
      "Hold onto the bench for support.",
      "Keeping your upper body still, bend your knees and curl your legs towards your glutes.",
      "Pause for a moment at the top, then slowly extend your legs back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Inverse Leg Curl (bench Support)",
    "secondaryMuscles": [
      "Glutes",
      "Calves"
    ],
    "target": "Hamstrings"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The inverse leg curl (on pull-up cable machine) is a bodyweight exercise targeting the hamstrings, with secondary emphasis on the glutes and calves. It involves lying face down, attaching ankle straps to a cable machine, and curling the legs towards the glutes.",
    "difficulty": "advanced",
    "equipment": "body weight",
    "id": "2400",
    "imageAssetId": "2400",
    "instructions": [
      "Adjust the cable machine so that the ankle straps are at the lowest setting.",
      "Lie face down on the bench with your legs extended and the ankle straps attached to your feet.",
      "Hold onto the handles of the bench for stability.",
      "Bend your knees and curl your legs towards your glutes, squeezing your hamstrings.",
      "Pause for a moment at the top of the movement, then slowly lower your legs back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Inverse Leg Curl (on Pull-up Cable Machine)",
    "secondaryMuscles": [
      "Glutes",
      "Calves"
    ],
    "target": "Hamstrings"
  },
  {
    "bodyPart": "cardio",
    "category": "cardio",
    "description": "The jack burpee is a high-intensity, full-body exercise that combines a squat, push-up, and jump to elevate heart rate and improve cardiovascular fitness while also engaging multiple muscle groups.",
    "difficulty": "advanced",
    "equipment": "body weight",
    "id": "0501",
    "imageAssetId": "0501",
    "instructions": [
      "Start in a standing position with your feet shoulder-width apart.",
      "Lower your body into a squat position, placing your hands on the ground in front of you.",
      "Kick your feet back, landing in a push-up position.",
      "Perform a push-up, lowering your chest to the ground and then pushing back up.",
      "Jump your feet forward, landing in a squat position.",
      "Jump up explosively, reaching your arms overhead.",
      "Land softly and immediately lower back into the squat position to begin the next repetition."
    ],
    "name": "Jack Burpee",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Calves",
      "Shoulders",
      "Triceps",
      "Core"
    ],
    "target": "Cardiovascular System"
  },
  {
    "bodyPart": "cardio",
    "category": "cardio",
    "description": "A dynamic bodyweight exercise that involves jumping with feet apart and arms overhead, then returning to the starting position. This movement elevates the heart rate and targets the cardiovascular system, with secondary emphasis on the quadriceps and calves.",
    "difficulty": "beginner",
    "equipment": "body weight",
    "id": "3224",
    "imageAssetId": "3224",
    "instructions": [
      "Stand with your feet together and your arms by your sides.",
      "Jump up, spreading your feet apart and raising your arms above your head.",
      "As you land, quickly jump back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Jack Jump (male)",
    "secondaryMuscles": [
      "Quadriceps",
      "Calves"
    ],
    "target": "Cardiovascular System"
  },
  {
    "bodyPart": "cardio",
    "category": "cardio",
    "description": "Jump rope is a cardiovascular exercise that involves continuously jumping over a swinging rope. It primarily targets the cardiovascular system while also engaging the calves, quadriceps, hamstrings, and glutes.",
    "difficulty": "beginner",
    "equipment": "rope",
    "id": "2612",
    "imageAssetId": "2612",
    "instructions": [
      "Hold the handles of the jump rope with your hands, palms facing inward.",
      "Stand with your feet shoulder-width apart and knees slightly bent.",
      "Swing the rope over your head and jump over it as it comes towards your feet.",
      "Land softly on the balls of your feet and repeat the jump as the rope comes around again.",
      "Continue jumping for the desired duration or number of repetitions."
    ],
    "name": "Jump Rope",
    "secondaryMuscles": [
      "Calves",
      "Quadriceps",
      "Hamstrings",
      "Glutes"
    ],
    "target": "Cardiovascular System"
  },
  {
    "bodyPart": "lower arms",
    "category": "strength",
    "description": "The kettlebell alternating hang clean is a dynamic exercise targeting the forearms, with significant involvement of the shoulders, traps, and core. It requires coordination, explosive power, and proper technique to safely transition the kettlebell from the hang to the rack position while alternating arms.",
    "difficulty": "intermediate",
    "equipment": "kettlebell",
    "id": "0518",
    "imageAssetId": "0518",
    "instructions": [
      "Stand with your feet shoulder-width apart, holding a kettlebell in each hand with an overhand grip.",
      "Bend your knees slightly and hinge forward at the hips, keeping your back straight and chest up.",
      "Allow the kettlebells to hang in front of your body with your arms fully extended.",
      "In one fluid motion, explosively extend your hips, shrug your shoulders, and pull the kettlebells up towards your shoulders.",
      "As the kettlebells reach shoulder height, rotate your wrists and catch the kettlebells in the rack position, with your palms facing inward and the kettlebells resting on the outside of your forearms.",
      "Lower the kettlebells back down to the starting position and repeat the movement with the opposite arm.",
      "Continue alternating arms for the desired number of repetitions."
    ],
    "name": "Kettlebell Alternating Hang Clean",
    "secondaryMuscles": [
      "Shoulders",
      "Traps",
      "Core"
    ],
    "target": "Forearms"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The lever alternate leg press is a machine-based exercise targeting the quadriceps, with secondary emphasis on the hamstrings and glutes. It involves pressing one leg at a time against a foot platform, providing a controlled environment for building lower body strength.",
    "difficulty": "beginner",
    "equipment": "leverage machine",
    "id": "2287",
    "imageAssetId": "2287",
    "instructions": [
      "Adjust the seat and foot platform of the leverage machine to your desired position.",
      "Sit on the machine with your back against the backrest and your feet on the foot platform.",
      "Place your hands on the handles or sides of the machine for stability.",
      "Push one foot against the foot platform, extending your leg until it is almost fully straight.",
      "Pause for a moment, then slowly bend your leg and return to the starting position.",
      "Repeat with the other leg.",
      "Continue alternating legs for the desired number of repetitions."
    ],
    "name": "Lever Alternate Leg Press",
    "secondaryMuscles": [
      "Hamstrings",
      "Glutes"
    ],
    "target": "Quads"
  },
  {
    "bodyPart": "lower legs",
    "category": "strength",
    "description": "The lever donkey calf raise is a machine-based exercise targeting the calf muscles. It involves standing on a platform with your heels hanging off, then raising and lowering your heels to work the calves. The leverage machine provides resistance and support, making it a controlled movement.",
    "difficulty": "beginner",
    "equipment": "leverage machine",
    "id": "1253",
    "imageAssetId": "1253",
    "instructions": [
      "Adjust the leverage machine to the appropriate height for your body.",
      "Position yourself facing the machine, with your toes on the foot platform and your heels hanging off the edge.",
      "Place your hands on the handles or the support bars for stability.",
      "Engage your calves and lift your heels as high as possible, using the balls of your feet.",
      "Pause for a moment at the top, then slowly lower your heels back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Lever Donkey Calf Raise",
    "secondaryMuscles": [
      "Hamstrings",
      "Glutes"
    ],
    "target": "Calves"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The lever horizontal one leg press is a lower body strength exercise performed on a leverage machine. It primarily targets the glutes, with secondary emphasis on the quadriceps, hamstrings, and calves. The exercise involves pressing a footplate away from the body using one leg at a time, which increases the demand for unilateral strength and stability.",
    "difficulty": "intermediate",
    "equipment": "leverage machine",
    "id": "2611",
    "imageAssetId": "2611",
    "instructions": [
      "Adjust the seat of the machine so that your knees are at a 90-degree angle when your feet are on the footplate.",
      "Sit on the machine with your back against the backrest and your feet shoulder-width apart on the footplate.",
      "Place your hands on the handles or sides of the machine for stability.",
      "Push the footplate away from your body by extending your leg, keeping your back against the backrest.",
      "Pause for a moment at the fully extended position, then slowly bend your leg to return to the starting position.",
      "Repeat for the desired number of repetitions, then switch legs."
    ],
    "name": "Lever Horizontal One Leg Press",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Calves"
    ],
    "target": "Glutes"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The lever kneeling leg curl is an isolation exercise targeting the hamstrings, performed on a leverage machine while kneeling. It primarily works the hamstrings and also engages the glutes as secondary muscles.",
    "difficulty": "intermediate",
    "equipment": "leverage machine",
    "id": "0582",
    "imageAssetId": "0582",
    "instructions": [
      "Adjust the machine to fit your body and select the desired weight.",
      "Kneel on the machine facing downwards, with your knees resting on the pad and your feet secured under the footpads.",
      "Grasp the handles or the sides of the machine for stability.",
      "Keeping your upper body stationary, exhale and curl your legs up towards your glutes by flexing your knees.",
      "Pause for a moment at the top of the movement, squeezing your hamstrings.",
      "Inhale and slowly lower your legs back to the starting position, fully extending your knees.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Lever Kneeling Leg Curl",
    "secondaryMuscles": [
      "Glutes"
    ],
    "target": "Hamstrings"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The lever lying leg curl is an isolation exercise targeting the hamstrings, performed on a leverage machine. It involves curling the legs upward against resistance while lying face down, emphasizing hamstring contraction and control.",
    "difficulty": "beginner",
    "equipment": "leverage machine",
    "id": "0586",
    "imageAssetId": "0586",
    "instructions": [
      "Adjust the machine to fit your body and select the desired weight.",
      "Lie face down on the machine with your legs straight and your heels against the padded lever.",
      "Grasp the handles or the sides of the machine for stability.",
      "Keeping your upper body stationary, exhale and curl your legs up as far as possible without lifting your hips off the pad.",
      "Hold the contracted position for a brief pause as you squeeze your hamstrings.",
      "Inhale and slowly lower the lever back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Lever Lying Leg Curl",
    "secondaryMuscles": [
      "Calves"
    ],
    "target": "Hamstrings"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The lever lying two-one leg curl is an isolation exercise targeting the hamstrings using a leverage machine. It involves curling the legs towards the glutes while lying on the machine, focusing on one leg at a time for increased intensity and muscle engagement.",
    "difficulty": "intermediate",
    "equipment": "leverage machine",
    "id": "3195",
    "imageAssetId": "3195",
    "instructions": [
      "Adjust the machine to fit your body and sit on it with your back against the backrest.",
      "Place your legs on the lever pad, just above your ankles.",
      "Grasp the handles on the sides of the machine for support.",
      "Keeping your upper body still, exhale and curl your legs up towards your glutes.",
      "Pause for a moment at the top, then inhale and slowly lower your legs back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Lever Lying Two-one Leg Curl",
    "secondaryMuscles": [
      "Glutes"
    ],
    "target": "Hamstrings"
  },
  {
    "bodyPart": "lower legs",
    "category": "strength",
    "description": "The lever seated calf raise is a machine-based exercise that targets the calf muscles, particularly the gastrocnemius and soleus. It is performed while seated, using a leverage machine to provide resistance as you raise and lower your heels.",
    "difficulty": "beginner",
    "equipment": "leverage machine",
    "id": "0594",
    "imageAssetId": "0594",
    "instructions": [
      "Adjust the seat height so that your knees are slightly bent and your feet are flat on the footplate.",
      "Place your toes on the footplate with your heels hanging off the edge.",
      "Grasp the handles or the sides of the seat for stability.",
      "Push through the balls of your feet to raise your heels as high as possible.",
      "Pause for a moment at the top, then slowly lower your heels back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Lever Seated Calf Raise",
    "secondaryMuscles": [
      "Soleus",
      "Ankle Stabilizers"
    ],
    "target": "Calves"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The lever seated leg curl is a machine-based exercise that targets the hamstrings. It involves curling your lower legs against resistance while seated, isolating the hamstrings and minimizing involvement from other muscle groups.",
    "difficulty": "beginner",
    "equipment": "leverage machine",
    "id": "0599",
    "imageAssetId": "0599",
    "instructions": [
      "Adjust the machine to fit your body and sit on it with your back against the backrest.",
      "Place your lower legs under the padded lever, just above your ankles.",
      "Grasp the handles on the sides of the machine for support.",
      "Keeping your upper legs stationary, exhale and curl your legs up as far as possible.",
      "Hold the contracted position for a brief pause as you squeeze your hamstrings.",
      "Inhale and slowly lower the lever back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Lever Seated Leg Curl",
    "secondaryMuscles": [
      "Calves"
    ],
    "target": "Hamstrings"
  },
  {
    "bodyPart": "lower legs",
    "category": "strength",
    "description": "The lever seated squat calf raise on leg press machine is an isolation exercise targeting the calves, performed on a leg press machine by extending and flexing the ankles while seated.",
    "difficulty": "beginner",
    "equipment": "leverage machine",
    "id": "1385",
    "imageAssetId": "1385",
    "instructions": [
      "Adjust the seat of the leg press machine so that your knees are slightly bent when your feet are on the footplate.",
      "Sit on the machine with your back against the backrest and your feet flat on the footplate, shoulder-width apart.",
      "Place your toes and the balls of your feet on the footplate, keeping your heels off the edge.",
      "Release the safety handles and push the footplate away from you by extending your knees.",
      "Once your knees are fully extended, slowly lower your heels by flexing your calves.",
      "Pause for a moment at the bottom, then push the footplate back up by extending your calves.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Lever Seated Squat Calf Raise On Leg Press Machine",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Glutes"
    ],
    "target": "Calves"
  },
  {
    "bodyPart": "lower legs",
    "category": "strength",
    "description": "The lever standing calf raise is a strength exercise performed on a leverage machine, targeting the calves. It involves raising and lowering the heels while standing, using resistance provided by the machine.",
    "difficulty": "beginner",
    "equipment": "leverage machine",
    "id": "0605",
    "imageAssetId": "0605",
    "instructions": [
      "Adjust the machine to your height and stand with your feet shoulder-width apart.",
      "Place your shoulders under the pads and hold onto the handles for stability.",
      "Raise your heels as high as possible by extending your ankles.",
      "Pause for a moment at the top, then slowly lower your heels back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Lever Standing Calf Raise",
    "secondaryMuscles": [
      "Soleus",
      "Ankle Stabilizers"
    ],
    "target": "Calves"
  },
  {
    "bodyPart": "cardio",
    "category": "cardio",
    "description": "Mountain climbers are a dynamic bodyweight exercise that targets the cardiovascular system while also engaging the core, shoulders, and triceps. The movement mimics a running motion in a plank position, making it effective for both cardio and muscular endurance.",
    "difficulty": "beginner",
    "equipment": "body weight",
    "id": "0630",
    "imageAssetId": "0630",
    "instructions": [
      "Start in a high plank position with your hands directly under your shoulders and your body in a straight line.",
      "Engage your core and bring your right knee towards your chest, then quickly switch and bring your left knee towards your chest.",
      "Continue alternating legs in a running motion, keeping your hips low and your core engaged.",
      "Maintain a steady pace and breathe evenly throughout the exercise.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Mountain Climber",
    "secondaryMuscles": [
      "Core",
      "Shoulders",
      "Triceps"
    ],
    "target": "Cardiovascular System"
  },
  {
    "bodyPart": "neck",
    "category": "stretching",
    "description": "A gentle stretch targeting the side of the neck, primarily the levator scapulae, performed by tilting the head to the side while standing or sitting.",
    "difficulty": "beginner",
    "equipment": "body weight",
    "id": "1403",
    "imageAssetId": "1403",
    "instructions": [
      "Stand or sit up straight with your shoulders relaxed.",
      "Tilt your head to one side, bringing your ear towards your shoulder.",
      "Hold the stretch for 15-30 seconds.",
      "Repeat on the other side.",
      "Perform 2-4 sets on each side."
    ],
    "name": "Neck Side Stretch",
    "secondaryMuscles": [
      "Trapezius",
      "Sternocleidomastoid"
    ],
    "target": "Levator Scapulae"
  },
  {
    "bodyPart": "upper arms",
    "category": "strength",
    "description": "The olympic barbell hammer curl is a strength exercise targeting the biceps and forearms. It involves curling an Olympic barbell with a neutral grip, emphasizing both the biceps and brachialis muscles.",
    "difficulty": "intermediate",
    "equipment": "olympic barbell",
    "id": "0636",
    "imageAssetId": "0636",
    "instructions": [
      "Stand up straight with your feet shoulder-width apart and hold an Olympic barbell with an overhand grip.",
      "Let the barbell hang at arm's length in front of your thighs, with your palms facing your body.",
      "Keeping your upper arms stationary, exhale and curl the weights while contracting your biceps.",
      "Continue to raise the barbell until your biceps are fully contracted and the barbell is at shoulder level.",
      "Hold the contracted position for a brief pause as you squeeze your biceps.",
      "Inhale and slowly begin to lower the barbell back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Olympic Barbell Hammer Curl",
    "secondaryMuscles": [
      "Forearms"
    ],
    "target": "Biceps"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The resistance band seated shoulder press is an overhead pressing exercise performed while seated, using a resistance band to target the deltoid muscles. It also engages the triceps and upper back as secondary muscles. This exercise is suitable for building shoulder strength and stability, and is accessible for most fitness levels due to the controlled movement and support provided by the seated position.",
    "difficulty": "beginner",
    "equipment": "resistance band",
    "id": "3122",
    "imageAssetId": "3122",
    "instructions": [
      "Sit on a chair or bench with your back straight and feet flat on the ground.",
      "Hold the resistance band with both hands, palms facing forward, and bring it up to shoulder level.",
      "Press the band overhead, extending your arms fully.",
      "Pause for a moment at the top, then slowly lower the band back down to shoulder level.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Resistance Band Seated Shoulder Press",
    "secondaryMuscles": [
      "Triceps",
      "Upper Back"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "back",
    "category": "strength",
    "description": "The reverse grip machine lat pulldown targets the latissimus dorsi using a leverage machine and an underhand grip, also engaging the biceps and forearms. It is performed seated with controlled movement, focusing on pulling the handles down to the chest and squeezing the shoulder blades together.",
    "difficulty": "beginner",
    "equipment": "leverage machine",
    "id": "0673",
    "imageAssetId": "0673",
    "instructions": [
      "Adjust the seat height and position yourself on the machine with your knees under the pads and your feet flat on the ground.",
      "Grasp the handles with an underhand grip, slightly wider than shoulder-width apart.",
      "Sit upright with your chest out and shoulders back, maintaining a slight arch in your lower back.",
      "Pull the handles down towards your chest, squeezing your shoulder blades together.",
      "Pause for a moment at the bottom of the movement, then slowly release the handles back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Reverse Grip Machine Lat Pulldown",
    "secondaryMuscles": [
      "Biceps",
      "Forearms"
    ],
    "target": "Lats"
  },
  {
    "bodyPart": "cardio",
    "category": "cardio",
    "description": "Running is a fundamental cardiovascular exercise that involves jogging or running in place or over a distance. It primarily targets the cardiovascular system and also engages the lower body muscles.",
    "difficulty": "beginner",
    "equipment": "body weight",
    "id": "0685",
    "imageAssetId": "0685",
    "instructions": [
      "Start by standing upright with your feet hip-width apart.",
      "Engage your core and keep your upper body relaxed.",
      "Begin jogging in place, lifting your knees up towards your chest and landing softly on the balls of your feet.",
      "Maintain a steady pace and continue jogging for the desired duration or distance.",
      "Remember to breathe deeply and maintain good posture throughout the exercise."
    ],
    "name": "Run",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Calves"
    ],
    "target": "Cardiovascular System"
  },
  {
    "bodyPart": "cardio",
    "category": "cardio",
    "description": "Running in place is a cardiovascular exercise that elevates the heart rate and improves overall endurance. It requires no equipment and can be performed anywhere, making it accessible for most fitness levels.",
    "difficulty": "beginner",
    "equipment": "body weight",
    "id": "0684",
    "imageAssetId": "0684",
    "instructions": [
      "Start by standing upright with your feet hip-width apart.",
      "Engage your core and keep your upper body relaxed.",
      "Begin jogging in place, lifting your knees up towards your chest and landing softly on the balls of your feet.",
      "Maintain a steady pace and continue jogging for the desired duration or distance.",
      "Remember to breathe deeply and maintain good posture throughout the exercise."
    ],
    "name": "Run (equipment)",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Calves"
    ],
    "target": "Cardiovascular System"
  },
  {
    "bodyPart": "cardio",
    "category": "cardio",
    "description": "Scissor jumps are a plyometric cardio exercise that involves jumping and alternating the crossing of your legs in mid-air. This movement elevates the heart rate and challenges coordination and lower body strength.",
    "difficulty": "intermediate",
    "equipment": "body weight",
    "id": "3219",
    "imageAssetId": "3219",
    "instructions": [
      "Stand with your feet shoulder-width apart.",
      "Jump off the ground and simultaneously cross your right leg in front of your left leg.",
      "As you land, quickly switch legs, crossing your left leg in front of your right leg.",
      "Continue alternating legs and jumping as quickly as possible.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Scissor Jumps (male)",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Calves"
    ],
    "target": "Cardiovascular System"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The self assisted inverse leg curl is a bodyweight exercise targeting the hamstrings, with secondary emphasis on the glutes and calves. It involves curling the legs towards the chest while lying on your back, using your hands for support if needed.",
    "difficulty": "beginner",
    "equipment": "body weight",
    "id": "0697",
    "imageAssetId": "0697",
    "instructions": [
      "Lie flat on your back on a mat or bench with your legs extended.",
      "Place your hands by your sides or under your glutes for support.",
      "Bend your knees and lift your feet off the ground, bringing your thighs towards your chest.",
      "Pause for a moment at the top, then slowly lower your legs back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Self Assisted Inverse Leg Curl",
    "secondaryMuscles": [
      "Glutes",
      "Calves"
    ],
    "target": "Hamstrings"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The self assisted inverse leg curl is a bodyweight exercise targeting the hamstrings, performed by lying face down and curling the legs upward against gravity, often using the arms for assistance. It primarily works the hamstrings, with secondary emphasis on the glutes and calves.",
    "difficulty": "advanced",
    "equipment": "body weight",
    "id": "1766",
    "imageAssetId": "1766",
    "instructions": [
      "Lie face down on a leg curl machine with your legs extended and your ankles hooked under the padded lever.",
      "Place your hands on the side handles of the machine for support.",
      "Keeping your upper body stationary, exhale and curl your legs upward as far as possible.",
      "Hold the contracted position for a brief pause as you squeeze your hamstrings.",
      "Slowly lower your legs back to the starting position while inhaling.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Self Assisted Inverse Leg Curl",
    "secondaryMuscles": [
      "Glutes",
      "Calves"
    ],
    "target": "Hamstrings"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The self assisted inverse leg curl (on floor) is a bodyweight exercise targeting the hamstrings, with secondary emphasis on the glutes and calves. It involves curling the legs towards the glutes while keeping the hips lifted, requiring significant hamstring strength and control.",
    "difficulty": "intermediate",
    "equipment": "body weight",
    "id": "0696",
    "imageAssetId": "0696",
    "instructions": [
      "Lie flat on your back with your legs extended and your arms by your sides.",
      "Bend your knees and place your feet flat on the ground, hip-width apart.",
      "Lift your hips off the ground, engaging your glutes and hamstrings.",
      "Slowly curl your legs towards your glutes, keeping your hips lifted.",
      "Pause for a moment at the top, then slowly extend your legs back to the starting position.",
      "Lower your hips back down to the ground.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Self Assisted Inverse Leg Curl (on Floor)",
    "secondaryMuscles": [
      "Glutes",
      "Calves"
    ],
    "target": "Hamstrings"
  },
  {
    "bodyPart": "cardio",
    "category": "cardio",
    "description": "The semi squat jump is a plyometric exercise that targets the cardiovascular system while also engaging the quadriceps, hamstrings, and calves. It involves performing a partial squat followed by an explosive jump, making it effective for improving cardiovascular fitness, lower body power, and coordination.",
    "difficulty": "intermediate",
    "equipment": "body weight",
    "id": "3222",
    "imageAssetId": "3222",
    "instructions": [
      "Stand with your feet shoulder-width apart.",
      "Bend your knees and lower your body into a squat position.",
      "Jump explosively, extending your hips and knees while swinging your arms for momentum.",
      "Land softly on the balls of your feet and immediately go into the next repetition.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Semi Squat Jump (male)",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Calves"
    ],
    "target": "Cardiovascular System"
  },
  {
    "bodyPart": "neck",
    "category": "stretching",
    "description": "The side push neck stretch is a gentle stretching exercise targeting the levator scapulae and other neck muscles. It helps improve flexibility and relieve tension in the neck and upper shoulders.",
    "difficulty": "beginner",
    "equipment": "body weight",
    "id": "0716",
    "imageAssetId": "0716",
    "instructions": [
      "Stand or sit up straight with your shoulders relaxed.",
      "Tilt your head to the right, bringing your right ear towards your right shoulder.",
      "Place your right hand on the left side of your head and gently apply pressure to increase the stretch.",
      "Hold the stretch for 15-30 seconds.",
      "Repeat on the other side, tilting your head to the left and applying pressure with your left hand.",
      "Repeat the stretch 2-3 times on each side."
    ],
    "name": "Side Push Neck Stretch",
    "secondaryMuscles": [
      "Trapezius",
      "Sternocleidomastoid"
    ],
    "target": "Levator Scapulae"
  },
  {
    "bodyPart": "lower legs",
    "category": "strength",
    "description": "The single leg calf raise (on a dumbbell) is a lower leg exercise that targets the calves, with secondary emphasis on the ankles and feet. It involves balancing on one leg while holding a dumbbell and performing a calf raise, which increases the challenge to balance and strength.",
    "difficulty": "intermediate",
    "equipment": "dumbbell",
    "id": "0727",
    "imageAssetId": "0727",
    "instructions": [
      "Stand with your feet hip-width apart and hold a dumbbell in one hand.",
      "Lift one foot off the ground and balance on the other foot.",
      "Slowly raise your heel as high as possible, using your calf muscles.",
      "Pause for a moment at the top, then slowly lower your heel back down.",
      "Repeat for the desired number of repetitions, then switch to the other leg."
    ],
    "name": "Single Leg Calf Raise (on A Dumbbell)",
    "secondaryMuscles": [
      "Ankles",
      "Feet"
    ],
    "target": "Calves"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The sled 45 degrees one leg press is a lower body exercise performed on a sled machine at a 45-degree angle, focusing on one leg at a time to target the glutes, quadriceps, hamstrings, and calves. It helps build unilateral leg strength and muscle balance.",
    "difficulty": "intermediate",
    "equipment": "sled machine",
    "id": "1425",
    "imageAssetId": "1425",
    "instructions": [
      "Adjust the sled machine to a 45-degree angle.",
      "Sit on the sled machine with your back against the pad and your feet on the footplate.",
      "Place one foot on the footplate and extend your leg, pushing the sled away from you.",
      "Slowly bend your knee and lower the sled back to the starting position.",
      "Repeat with the other leg.",
      "Continue alternating legs for the desired number of repetitions."
    ],
    "name": "Sled 45 Degrees One Leg Press",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Calves"
    ],
    "target": "Glutes"
  },
  {
    "bodyPart": "lower legs",
    "category": "strength",
    "description": "The sled 45° calf press is a machine-based exercise that targets the calves by pressing a weighted sled away using the balls of your feet, focusing on ankle extension.",
    "difficulty": "beginner",
    "equipment": "sled machine",
    "id": "0738",
    "imageAssetId": "0738",
    "instructions": [
      "Adjust the sled machine to a 45-degree angle.",
      "Place your feet on the sled platform with your toes pointing forward.",
      "Push the sled platform away from you by extending your ankles and calves.",
      "Pause for a moment at the top, then slowly lower the sled platform back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Sled 45° Calf Press",
    "secondaryMuscles": [
      "Hamstrings"
    ],
    "target": "Calves"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The sled 45° leg press is a compound lower body exercise performed on a sled machine. It primarily targets the glutes, with secondary emphasis on the quadriceps, hamstrings, and calves. The exercise involves pushing a weighted footplate away from the body while seated at a 45-degree angle, making it a popular choice for building lower body strength.",
    "difficulty": "beginner",
    "equipment": "sled machine",
    "id": "0739",
    "imageAssetId": "0739",
    "instructions": [
      "Adjust the seat and footplate of the sled machine to a comfortable position.",
      "Sit on the sled machine with your back against the backrest and your feet shoulder-width apart on the footplate.",
      "Grip the handles on the sides of the seat for stability.",
      "Push the footplate away from your body by extending your legs, keeping your heels on the footplate.",
      "Continue pushing until your legs are almost fully extended, but without locking your knees.",
      "Pause for a moment at the top of the movement, then slowly lower the footplate back towards your body by bending your knees.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Sled 45° Leg Press",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Calves"
    ],
    "target": "Glutes"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The sled 45° leg press (back POV) is a compound lower body exercise performed on a sled machine. It primarily targets the glutes, with secondary emphasis on the quadriceps, hamstrings, and calves. The movement involves extending and flexing the legs to press a weighted footplate away from and toward the body.",
    "difficulty": "beginner",
    "equipment": "sled machine",
    "id": "1464",
    "imageAssetId": "1464",
    "instructions": [
      "Adjust the seat of the sled machine so that your knees are at a 45-degree angle.",
      "Sit on the sled machine with your back against the backrest and your feet shoulder-width apart on the footplate.",
      "Grip the handles on the sides of the seat for stability.",
      "Push the footplate away from your body by extending your legs, keeping your heels on the footplate.",
      "Pause for a moment at the fully extended position.",
      "Slowly bend your knees and lower the footplate back towards your body, controlling the movement.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Sled 45° Leg Press (back Pov)",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Calves"
    ],
    "target": "Glutes"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The sled 45° leg press (side pov) is a compound lower body exercise performed on a sled machine. It primarily targets the glutes and also works the quadriceps, hamstrings, and calves. The movement involves pressing a weighted footplate away from the body by extending the legs, then returning to the starting position by bending the knees.",
    "difficulty": "beginner",
    "equipment": "sled machine",
    "id": "1463",
    "imageAssetId": "1463",
    "instructions": [
      "Adjust the seat of the sled machine so that your knees are at a 90-degree angle when your feet are on the footplate.",
      "Sit on the sled machine with your back flat against the backrest and your feet shoulder-width apart on the footplate.",
      "Grip the handles on the sides of the seat for stability.",
      "Push against the footplate to extend your legs, straightening them completely.",
      "Pause for a moment at the top, then slowly bend your knees to lower the footplate back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Sled 45° Leg Press (side Pov)",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Calves"
    ],
    "target": "Glutes"
  },
  {
    "bodyPart": "lower legs",
    "category": "strength",
    "description": "The sled calf press on leg press is an exercise that targets the calves using a sled (leg press) machine. It also engages the hamstrings and quadriceps as secondary muscles. The movement involves pressing the sled away using the balls of your feet, focusing on ankle extension.",
    "difficulty": "beginner",
    "equipment": "sled machine",
    "id": "1391",
    "imageAssetId": "1391",
    "instructions": [
      "Adjust the seat of the leg press machine so that your knees are slightly bent when your feet are on the sled.",
      "Place your feet shoulder-width apart on the sled, with your toes pointing forward.",
      "Release the safety handles and push the sled away from you by extending your knees and ankles.",
      "Pause for a moment at the top of the movement, then slowly lower the sled back down by bending your knees and ankles.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Sled Calf Press On Leg Press",
    "secondaryMuscles": [
      "Hamstrings",
      "Quadriceps"
    ],
    "target": "Calves"
  },
  {
    "bodyPart": "lower legs",
    "category": "strength",
    "description": "The sled forward angled calf raise is a resistance exercise performed on a sled machine, targeting the calf muscles. The movement involves raising and lowering the heels while the toes remain on the platform, using the sled machine for added resistance.",
    "difficulty": "beginner",
    "equipment": "sled machine",
    "id": "0742",
    "imageAssetId": "0742",
    "instructions": [
      "Adjust the sled machine to a comfortable weight and position yourself on the machine with your toes on the platform and your heels hanging off.",
      "Place your hands on the handles or the sides of the machine for support.",
      "Engage your calves and slowly raise your heels as high as possible, pushing against the resistance of the sled.",
      "Pause for a moment at the top of the movement, then slowly lower your heels back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Sled Forward Angled Calf Raise",
    "secondaryMuscles": [
      "Hamstrings",
      "Glutes"
    ],
    "target": "Calves"
  },
  {
    "bodyPart": "lower legs",
    "category": "strength",
    "description": "The sled one leg calf press on leg press is a machine-based exercise targeting the calves, performed one leg at a time for increased isolation and intensity. It also engages the hamstrings and glutes as secondary muscles.",
    "difficulty": "intermediate",
    "equipment": "sled machine",
    "id": "1392",
    "imageAssetId": "1392",
    "instructions": [
      "Adjust the seat of the leg press machine so that your knees are slightly bent when your feet are on the sled.",
      "Sit on the machine with your back against the backrest and your feet on the sled, shoulder-width apart.",
      "Place your toes and the balls of your feet on the sled, keeping your heels off.",
      "Push the sled forward by extending your ankles, keeping your knees slightly bent.",
      "Pause for a moment at the top, then slowly lower the sled back down by flexing your ankles.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Sled One Leg Calf Press On Leg Press",
    "secondaryMuscles": [
      "Hamstrings",
      "Glutes"
    ],
    "target": "Calves"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The smith leg press is a lower body exercise performed on a smith machine, targeting the glutes with secondary emphasis on the quadriceps, hamstrings, and calves. It involves pressing a footplate away from the body while seated, using the legs to extend and flex at the knees and hips.",
    "difficulty": "beginner",
    "equipment": "smith machine",
    "id": "0760",
    "imageAssetId": "0760",
    "instructions": [
      "Adjust the seat and footplate of the smith machine to a comfortable position.",
      "Sit on the machine with your back against the backrest and your feet shoulder-width apart on the footplate.",
      "Grasp the handles or sides of the machine for stability.",
      "Push the footplate away from you by extending your legs, keeping your back against the backrest.",
      "Pause for a moment at the fully extended position.",
      "Slowly bend your knees and lower the footplate back towards you, returning to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Smith Leg Press",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Calves"
    ],
    "target": "Glutes"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The smith rear delt row is a machine-based exercise targeting the rear deltoids, with secondary emphasis on the trapezius, rhomboids, and biceps. It involves pulling a bar towards your chest while keeping your chest against a pad, focusing on squeezing the shoulder blades together.",
    "difficulty": "beginner",
    "equipment": "smith machine",
    "id": "0762",
    "imageAssetId": "0762",
    "instructions": [
      "Adjust the seat height and position yourself on the machine with your chest against the pad and your feet flat on the ground.",
      "Grasp the handles with an overhand grip, slightly wider than shoulder-width apart.",
      "Keep your back straight and your core engaged as you pull the handles towards your chest, squeezing your shoulder blades together.",
      "Pause for a moment at the top of the movement, then slowly release the handles back to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Smith Rear Delt Row",
    "secondaryMuscles": [
      "Trapezius",
      "Rhomboids",
      "Biceps"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "lower legs",
    "category": "strength",
    "description": "The smith reverse calf raises is a lower leg exercise performed on a smith machine, primarily targeting the calves and secondarily engaging the hamstrings. The movement involves raising and lowering the heels while standing on a step, using the smith machine bar for support.",
    "difficulty": "beginner",
    "equipment": "smith machine",
    "id": "0763",
    "imageAssetId": "0763",
    "instructions": [
      "Adjust the smith machine bar to a height just below your shoulders.",
      "Stand facing the bar with your feet hip-width apart and toes pointing forward.",
      "Place the balls of your feet on the edge of a step or platform, with your heels hanging off.",
      "Hold onto the bar for support, keeping your back straight and core engaged.",
      "Raise your heels as high as possible, lifting your body weight onto the balls of your feet.",
      "Pause for a moment at the top, then slowly lower your heels back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Smith Reverse Calf Raises",
    "secondaryMuscles": [
      "Hamstrings"
    ],
    "target": "Calves"
  },
  {
    "bodyPart": "shoulders",
    "category": "strength",
    "description": "The smith seated shoulder press is a machine-based exercise targeting the deltoid muscles of the shoulders. It provides stability and support, making it suitable for those looking to build shoulder strength with reduced risk of losing balance. The movement also engages the triceps and upper back as secondary muscles.",
    "difficulty": "beginner",
    "equipment": "smith machine",
    "id": "0765",
    "imageAssetId": "0765",
    "instructions": [
      "Adjust the seat height so that the handles are at shoulder level.",
      "Sit on the machine with your back against the pad and your feet flat on the floor.",
      "Grasp the handles with an overhand grip and lift them off the supports, extending your arms fully.",
      "Lower the handles down to shoulder level, keeping your elbows slightly bent.",
      "Press the handles up overhead until your arms are fully extended.",
      "Pause for a moment at the top, then slowly lower the handles back down to shoulder level.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Smith Seated Shoulder Press",
    "secondaryMuscles": [
      "Triceps",
      "Upper Back"
    ],
    "target": "Delts"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The smith single leg split squat is a lower body exercise performed using a smith machine. It targets the quadriceps while also engaging the glutes and hamstrings. The exercise requires balance and unilateral strength, as one leg is elevated behind you on a bench or step.",
    "difficulty": "intermediate",
    "equipment": "smith machine",
    "id": "0768",
    "imageAssetId": "0768",
    "instructions": [
      "Stand in front of the smith machine with your feet shoulder-width apart.",
      "Place one foot behind you on a bench or step, with your toes pointing forward.",
      "Hold onto the smith machine bar for stability.",
      "Bend your front knee and lower your body down into a lunge position, keeping your back straight.",
      "Pause for a moment at the bottom, then push through your front heel to return to the starting position.",
      "Repeat for the desired number of repetitions, then switch legs."
    ],
    "name": "Smith Single Leg Split Squat",
    "secondaryMuscles": [
      "Glutes",
      "Hamstrings"
    ],
    "target": "Quads"
  },
  {
    "bodyPart": "lower legs",
    "category": "strength",
    "description": "The smith standing leg calf raise is a lower leg exercise performed using a smith machine. It primarily targets the calves, with secondary emphasis on the hamstrings and glutes. The movement involves raising the heels to stand on the toes, then lowering back down, using the smith machine for stability and added resistance.",
    "difficulty": "beginner",
    "equipment": "smith machine",
    "id": "0773",
    "imageAssetId": "0773",
    "instructions": [
      "Adjust the smith machine bar to a height that allows you to stand with your feet flat on the ground and your shoulders under the bar.",
      "Position yourself under the bar with your feet shoulder-width apart and your toes pointing forward.",
      "Place your hands on the bar for stability.",
      "Engage your calves and slowly raise your heels off the ground, lifting your body up onto your toes.",
      "Pause for a moment at the top, then slowly lower your heels back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Smith Standing Leg Calf Raise",
    "secondaryMuscles": [
      "Hamstrings",
      "Glutes"
    ],
    "target": "Calves"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "Split squats are a lower body exercise that primarily targets the quadriceps, while also engaging the glutes, hamstrings, and calves. This bodyweight movement involves stepping forward into a split stance and lowering the body until the front thigh is parallel to the ground, then returning to the starting position.",
    "difficulty": "beginner",
    "equipment": "body weight",
    "id": "2368",
    "imageAssetId": "2368",
    "instructions": [
      "Stand with your feet shoulder-width apart.",
      "Take a step forward with one foot and place it about two feet in front of the other foot.",
      "Lower your body by bending your knees and hips, keeping your back straight.",
      "Continue lowering until your front thigh is parallel to the ground, and your back knee is hovering just above the ground.",
      "Pause for a moment, then push through your front heel to return to the starting position.",
      "Repeat for the desired number of repetitions, then switch legs and repeat."
    ],
    "name": "Split Squats",
    "secondaryMuscles": [
      "Glutes",
      "Hamstrings",
      "Calves"
    ],
    "target": "Quads"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The standing single leg curl is a bodyweight exercise targeting the hamstrings and glutes. It involves balancing on one leg while curling the opposite heel toward the glutes, emphasizing hamstring activation and single-leg stability.",
    "difficulty": "beginner",
    "equipment": "body weight",
    "id": "0795",
    "imageAssetId": "0795",
    "instructions": [
      "Stand with your feet hip-width apart and your hands on your hips.",
      "Shift your weight onto your left leg and lift your right foot off the ground, bending your knee.",
      "Slowly curl your right heel towards your glutes, squeezing your hamstring.",
      "Pause for a moment at the top, then slowly lower your right foot back down to the starting position.",
      "Repeat for the desired number of repetitions, then switch legs."
    ],
    "name": "Standing Single Leg Curl",
    "secondaryMuscles": [
      "Glutes"
    ],
    "target": "Hamstrings"
  },
  {
    "bodyPart": "cardio",
    "category": "cardio",
    "description": "The star jump (male) is a plyometric cardio exercise that involves jumping explosively while spreading the arms and legs out to form a star shape in the air. It targets the cardiovascular system and also engages the quadriceps, hamstrings, and calves.",
    "difficulty": "beginner",
    "equipment": "body weight",
    "id": "3223",
    "imageAssetId": "3223",
    "instructions": [
      "Stand with your feet shoulder-width apart and your arms by your sides.",
      "Bend your knees slightly and jump up explosively.",
      "As you jump, spread your legs and extend your arms out to the sides, forming a star shape with your body.",
      "Land softly on the balls of your feet with your knees slightly bent.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Star Jump (male)",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Calves"
    ],
    "target": "Cardiovascular System"
  },
  {
    "bodyPart": "cardio",
    "category": "cardio",
    "description": "The stationary bike run v. 3 is a cardiovascular exercise performed on a stationary bike. It primarily targets the cardiovascular system and also engages the quadriceps, hamstrings, and calves. The exercise involves pedaling at a steady rhythm, adjusting resistance as needed, and maintaining proper posture throughout the workout.",
    "difficulty": "beginner",
    "equipment": "stationary bike",
    "id": "2138",
    "imageAssetId": "2138",
    "instructions": [
      "Adjust the seat height and position to ensure proper alignment.",
      "Place your feet on the pedals and secure them with the straps if available.",
      "Start pedaling at a comfortable pace.",
      "Maintain a steady rhythm and increase the resistance as desired.",
      "Engage your core muscles to maintain stability and proper posture.",
      "Continue pedaling for the desired duration of your workout.",
      "Gradually decrease the resistance and slow down before coming to a complete stop.",
      "Stretch your legs and cool down after the workout."
    ],
    "name": "Stationary Bike Run V. 3",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Calves"
    ],
    "target": "Cardiovascular System"
  },
  {
    "bodyPart": "cardio",
    "category": "cardio",
    "description": "The stationary bike walk is a cardiovascular exercise performed on a leverage machine (stationary bike). It primarily targets the cardiovascular system and also engages the quadriceps, hamstrings, and calves. The exercise involves pedaling at a steady pace, with the option to adjust resistance for increased intensity.",
    "difficulty": "beginner",
    "equipment": "leverage machine",
    "id": "0798",
    "imageAssetId": "0798",
    "instructions": [
      "Adjust the seat height and position on the stationary bike to ensure proper alignment.",
      "Place your feet on the pedals and secure them with the straps if available.",
      "Start pedaling at a comfortable pace, keeping your back straight and core engaged.",
      "Maintain a steady rhythm and increase the resistance level if desired.",
      "Continue pedaling for the desired duration of your cardio workout.",
      "Cool down by gradually reducing your pace and resistance level.",
      "Stretch your leg muscles after the workout to prevent tightness and promote recovery."
    ],
    "name": "Stationary Bike Walk",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Calves"
    ],
    "target": "Cardiovascular System"
  },
  {
    "bodyPart": "upper legs",
    "category": "strength",
    "description": "The suspended split squat is a lower body exercise that targets the quads, with secondary emphasis on the glutes, hamstrings, and calves. It is performed using body weight and a suspension trainer, requiring balance, strength, and coordination.",
    "difficulty": "advanced",
    "equipment": "body weight",
    "id": "0809",
    "imageAssetId": "0809",
    "instructions": [
      "Stand facing away from a suspension trainer with your feet shoulder-width apart.",
      "Extend one leg forward and place the top of your foot in the foot cradle of the suspension trainer.",
      "Bend your standing leg and lower your body down into a lunge position, keeping your chest up and your knee in line with your toes.",
      "Push through your heel to return to the starting position.",
      "Repeat for the desired number of repetitions, then switch legs."
    ],
    "name": "Suspended Split Squat",
    "secondaryMuscles": [
      "Glutes",
      "Hamstrings",
      "Calves"
    ],
    "target": "Quads"
  },
  {
    "bodyPart": "cardio",
    "category": "cardio",
    "description": "The swing 360 is a dynamic bodyweight exercise that targets the cardiovascular system while also engaging the shoulders and core. It involves swinging the arms in a circular motion while rotating the torso, making it a great movement for increasing heart rate and improving coordination.",
    "difficulty": "beginner",
    "equipment": "body weight",
    "id": "3318",
    "imageAssetId": "3318",
    "instructions": [
      "Stand with your feet shoulder-width apart and knees slightly bent.",
      "Hold your arms straight out in front of you, parallel to the ground.",
      "Engage your core and swing your arms in a circular motion, rotating your torso as you do so.",
      "Continue the circular motion, swinging your arms and rotating your torso for the desired number of repetitions.",
      "Remember to breathe throughout the exercise."
    ],
    "name": "Swing 360",
    "secondaryMuscles": [
      "Shoulders",
      "Core"
    ],
    "target": "Cardiovascular System"
  },
  {
    "bodyPart": "back",
    "category": "strength",
    "description": "The twin handle parallel grip lat pulldown is a cable machine exercise targeting the latissimus dorsi, with secondary emphasis on the biceps, rhomboids, and rear deltoids. It involves pulling parallel handles down towards the chest while seated, focusing on squeezing the shoulder blades together.",
    "difficulty": "beginner",
    "equipment": "cable",
    "id": "0818",
    "imageAssetId": "0818",
    "instructions": [
      "Adjust the seat height and position yourself facing the cable machine.",
      "Grasp the handles with an overhand grip, hands shoulder-width apart.",
      "Sit down and position your thighs under the thigh pads, keeping your feet flat on the floor.",
      "Lean back slightly and keep your chest up, maintaining a neutral spine.",
      "Pull the handles down towards your upper chest, squeezing your shoulder blades together.",
      "Pause for a moment at the bottom of the movement, feeling the contraction in your lats.",
      "Slowly release the handles and return to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Twin Handle Parallel Grip Lat Pulldown",
    "secondaryMuscles": [
      "Biceps",
      "Rhomboids",
      "Rear Deltoids"
    ],
    "target": "Lats"
  },
  {
    "bodyPart": "cardio",
    "category": "cardio",
    "description": "The walk elliptical cross trainer is a cardiovascular exercise performed on an elliptical machine. It simulates a walking or running motion with low impact on the joints, making it suitable for a wide range of fitness levels. The exercise targets the cardiovascular system while also engaging the quadriceps, hamstrings, glutes, and calves.",
    "difficulty": "beginner",
    "equipment": "elliptical machine",
    "id": "2141",
    "imageAssetId": "2141",
    "instructions": [
      "Adjust the resistance level and incline of the elliptical machine to your desired settings.",
      "Step onto the pedals of the machine and grip the handles lightly.",
      "Begin by pushing down with your feet and pulling the handles towards your body.",
      "Continue this motion, alternating between pushing and pulling, to simulate a walking or running motion.",
      "Maintain a steady pace and keep your core engaged throughout the exercise.",
      "Continue for the desired duration of your cardio workout.",
      "Gradually decrease the intensity and speed of the machine before stepping off."
    ],
    "name": "Walk Elliptical Cross Trainer",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Glutes",
      "Calves"
    ],
    "target": "Cardiovascular System"
  },
  {
    "bodyPart": "cardio",
    "category": "cardio",
    "description": "Walking on a stepmill is a cardiovascular exercise performed on a machine that simulates stair climbing. It primarily targets the cardiovascular system while also engaging the lower body muscles.",
    "difficulty": "beginner",
    "equipment": "stepmill machine",
    "id": "2311",
    "imageAssetId": "2311",
    "instructions": [
      "Adjust the stepmill machine to a comfortable level.",
      "Step onto the machine and place your hands on the handrails for support.",
      "Start walking by placing one foot on a step and then the other, alternating between legs.",
      "Maintain an upright posture and engage your core muscles.",
      "Continue walking for the desired duration or distance.",
      "Gradually increase the intensity or speed as you become more comfortable with the exercise.",
      "Remember to cool down and stretch after completing the exercise."
    ],
    "name": "Walking On Stepmill",
    "secondaryMuscles": [
      "Quadriceps",
      "Hamstrings",
      "Glutes",
      "Calves"
    ],
    "target": "Cardiovascular System"
  },
  {
    "bodyPart": "lower legs",
    "category": "strength",
    "description": "The weighted donkey calf raise is a calf-focused exercise performed on a raised platform, where the lifter raises and lowers their heels while holding additional weight. This movement targets the calves and also engages the hamstrings and glutes as secondary muscles.",
    "difficulty": "intermediate",
    "equipment": "weighted",
    "id": "0833",
    "imageAssetId": "0833",
    "instructions": [
      "Stand on a raised platform with your toes on the edge and your heels hanging off.",
      "Hold onto a stable object for support.",
      "Raise your heels as high as possible by extending your ankles.",
      "Pause for a moment at the top, then slowly lower your heels back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Weighted Donkey Calf Raise",
    "secondaryMuscles": [
      "Hamstrings",
      "Glutes"
    ],
    "target": "Calves"
  },
  {
    "bodyPart": "back",
    "category": "strength",
    "description": "The weighted pull-up is an advanced variation of the standard pull-up, where additional weight is used to increase resistance. This exercise primarily targets the latissimus dorsi (lats) and also engages the biceps and forearms. It requires significant upper body strength, coordination, and experience to perform safely and effectively.",
    "difficulty": "advanced",
    "equipment": "weighted",
    "id": "0841",
    "imageAssetId": "0841",
    "instructions": [
      "Grab the pull-up bar with an overhand grip, slightly wider than shoulder-width apart.",
      "Hang from the bar with your arms fully extended and your body straight.",
      "Engage your back muscles and pull your body up towards the bar, keeping your elbows close to your body.",
      "Continue pulling until your chin is above the bar.",
      "Pause for a moment at the top, then slowly lower your body back down to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "name": "Weighted Pull-up",
    "secondaryMuscles": [
      "Biceps",
      "Forearms"
    ],
    "target": "Lats"
  }
];
