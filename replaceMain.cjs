const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const startTag = '{currentScreen === "Main" && (';
const endTag = '{currentScreen === "Chat" &&';

let startIndex = content.indexOf(startTag);
if (startIndex !== -1) {
  let endIndex = content.indexOf(endTag, startIndex);
  if (endIndex !== -1) {
    // Back up to the closing `</motion.div>\n              )}`
    const chunkToReplace = content.substring(startIndex, endIndex);
    const replacement = `{currentScreen === "Main" && (
                <MainDashboard
                  onboarding={onboarding}
                  isOnline={isOnline}
                  activeProject={activeProject}
                  projects={projects}
                  obdMode={obdMode}
                  setObdMode={setObdMode}
                  updateData={updateData}
                  obdConnected={obdConnected}
                  handleConnect={handleConnect}
                  setCurrentScreen={setCurrentScreen}
                  setChatMode={setChatMode}
                />
              )}\n\n              `;
    const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
    fs.writeFileSync('src/App.tsx', newContent, 'utf8');
    console.log("Successfully replaced Main screen block.");
  } else {
    console.log("Could not find end chunk");
  }
} else {
  console.log("Could not find start chunk");
}
