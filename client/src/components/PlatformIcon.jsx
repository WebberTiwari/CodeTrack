import { Box } from "@mui/material";
import { SiCodeforces, SiCodechef, SiLeetcode } from "react-icons/si";

export default function PlatformIcon({ platform, size = 28 }) {

  let icon = null;

  if (platform === "Codeforces")
    icon = <SiCodeforces color="#ff9800" size={size} />;

  else if (platform === "CodeChef")
    icon = <SiCodechef color="#8d6e63" size={size} />;

  else if (platform === "LeetCode")
    icon = <SiLeetcode color="#ffa116" size={size} />;

  return <Box sx={{ display: "flex", alignItems: "center" }}>{icon}</Box>;
}
