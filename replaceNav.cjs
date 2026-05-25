const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  'import { generateChatResponse } from "./services/geminiService";',
  'import { generateChatResponse } from "./services/geminiService";\nimport { useNavigation, Screen } from "./hooks/useNavigation";'
);

content = content.replace(
  'const [currentScreen, setCurrentScreen] = useState<Screen>("Welcome");',
  'const { currentScreen, navigate: setCurrentScreen, goBack } = useNavigation("Welcome");'
);

content = content.replace(/onBack=\{.*?setCurrentScreen\("Main"\)\}/g, 'onBack={() => goBack()}');

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log("Replaced setCurrentScreen with navigation stack.");
