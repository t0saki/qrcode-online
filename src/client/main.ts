import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/app.css";

import { mountApp } from "./app";
import { initI18n } from "./i18n/i18n";
import { initTheme } from "./theme";

initTheme();
initI18n();

const root = document.getElementById("app");
if (root) mountApp(root);
