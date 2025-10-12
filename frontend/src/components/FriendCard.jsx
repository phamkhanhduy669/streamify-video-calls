import { Link } from "react-router";
import { LANGUAGE_TO_FLAG } from "../constants";
import { safeBio, capitialize } from "../lib/utils";

const FriendCard = ({ friend }) => {
  const bio = safeBio(friend.bio);
  return (
    <div className="card h-full bg-base-200 hover:shadow-md transition-shadow">
      <div className="card-body p-4 flex flex-col justify-between h-full min-h-[220px]">
        {/* USER INFO */}
        <div className="flex items-center gap-3 mb-3">
          <div className="avatar size-12">
            <img src={friend.profilePic || "/i.png"} alt={friend.fullName || "Unknown"} />
          </div>
          <h3 className="font-semibold truncate">{friend.fullName || "Unknown"}</h3>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="badge badge-secondary text-xs">
            {getLanguageFlag(friend.nativeLanguage)}
            Native: {capitialize(friend.nativeLanguage)}
          </span>
          <span className="badge badge-outline text-xs">
            {getLanguageFlag(friend.learningLanguage)}
            Learning: {capitialize(friend.learningLanguage)}
          </span>
        </div>

        {bio && <p className="text-sm opacity-70 mb-3">{bio}</p>}

        <Link to={`/chat/${friend._id}`} className="btn btn-outline w-full mt-2">
          Message
        </Link>
      </div>
    </div>
  );
};
export default FriendCard;

export function getLanguageFlag(language) {
  if (!language) return null;

  const langLower = language.toLowerCase();
  const countryCode = LANGUAGE_TO_FLAG[langLower];

  if (countryCode) {
    return (
      <img
        src={`https://flagcdn.com/24x18/${countryCode}.png`}
        alt={`${langLower} flag`}
        className="h-3 mr-1 inline-block"
      />
    );
  }
  return null;
}
