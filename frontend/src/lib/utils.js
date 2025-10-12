export const capitialize = (str) => {
	if (!str) return "";
	const s = String(str);
	return s.charAt(0).toUpperCase() + s.slice(1);
};

export const safeBio = (bio) => {
	if (!bio) return "";
	const trimmed = String(bio).trim();
	if (!trimmed) return "";
	return trimmed;
};

import { LANGUAGE_TO_FLAG } from "../constants";

export const getFlagEmoji = (language) => {
	if (!language) return "";
	const langLower = String(language).toLowerCase();
	const cc = LANGUAGE_TO_FLAG[langLower];
	if (!cc) return "";
	// convert country code (e.g. 'gb') to regional indicator symbols (emoji)
	const chars = cc.toUpperCase().split("");
	return chars
		.map((ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)))
		.join("");
};
