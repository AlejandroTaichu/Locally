import { StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from "react-native-svg";

// Category illustrations, not photographs of the event or its venue.
export function eventPalette(category: string) {
  if (["Basketbol", "Dans", "Müzik"].includes(category))
    return { background: "#F1B18F", ink: "#82391E", accent: "#CF542A" };
  if (["Yüzme", "Kano/Kürek", "Bisiklet"].includes(category))
    return { background: "#BBD4D9", ink: "#30575B", accent: "#548B97" };
  if (
    [
      "Kahve/Sohbet Buluşması",
      "Kitap Kulübü",
      "Yemek/Mutfak",
      "Dil Pratiği",
    ].includes(category)
  )
    return { background: "#E7D6B5", ink: "#675039", accent: "#B58757" };
  return { background: "#CCD8B9", ink: "#3C523D", accent: "#839667" };
}

export default function EventArtwork({
  category,
  style,
}: {
  category: string;
  style?: StyleProp<ViewStyle>;
}) {
  const p = eventPalette(category);
  const court = ["Basketbol", "Tenis", "Halısaha"].includes(category);
  const social = [
    "Kahve/Sohbet Buluşması",
    "Kitap Kulübü",
    "Yemek/Mutfak",
    "Dil Pratiği",
  ].includes(category);
  const water = ["Yüzme", "Kano/Kürek"].includes(category);
  const movement = ["Koşu", "Bisiklet", "Doğa Yürüyüşü", "Tırmanış"].includes(
    category,
  );
  return (
    <View
      accessible={false}
      style={[styles.container, { backgroundColor: p.background }, style]}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 360 240"
        preserveAspectRatio="xMidYMid slice"
      >
        <Circle cx="325" cy="10" r="140" fill={p.accent} opacity="0.18" />
        <Circle cx="20" cy="230" r="95" fill="#FFF9EA" opacity="0.25" />
        {court ? (
          <>
            <G
              transform="translate(30 -30) rotate(-18 180 120)"
              stroke="#FFF8E8"
              strokeWidth="2"
              fill="none"
              opacity="0.7"
            >
              <Rect x="20" y="10" width="320" height="230" rx="3" />
              <Line x1="180" y1="10" x2="180" y2="240" />
              <Circle cx="180" cy="125" r="44" />
              <Rect x="20" y="72" width="58" height="106" />
              <Rect x="282" y="72" width="58" height="106" />
            </G>
            <Ellipse
              cx="225"
              cy="191"
              rx="65"
              ry="15"
              fill={p.ink}
              opacity="0.12"
            />
            <Circle
              cx="218"
              cy="127"
              r="62"
              fill={category === "Halısaha" ? "#F6F4E9" : p.accent}
              stroke={p.ink}
              strokeWidth="2.5"
            />
            <G stroke={p.ink} strokeWidth="2.5" fill="none">
              {category === "Basketbol" ? (
                <Path d="M159 109 Q218 144 276 110 M198 69 Q185 128 238 184 M174 85 Q240 103 265 167 M161 150 Q210 89 269 92" />
              ) : category === "Tenis" ? (
                <Path
                  d="M175 82 C239 105 186 149 259 173 M160 117 C193 135 164 159 200 186"
                  stroke="#FFF9EC"
                  strokeWidth="5"
                />
              ) : (
                <>
                  <Path
                    d="M218 98 L245 117 L235 148 L201 148 L191 117 Z"
                    fill={p.ink}
                  />
                  <Path d="M218 98 L218 66 M245 117 L276 107 M235 148 L253 178 M201 148 L181 177 M191 117 L160 106" />
                </>
              )}
            </G>
          </>
        ) : social ? (
          <G transform="rotate(-14 190 120)">
            <Rect
              x="91"
              y="40"
              width="174"
              height="170"
              rx="3"
              fill="#FFF8E8"
              opacity="0.65"
            />
            <Line
              x1="108"
              y1="183"
              x2="191"
              y2="183"
              stroke={p.accent}
              strokeWidth="3"
            />
            <Circle cx="191" cy="119" r="61" fill={p.accent} opacity="0.28" />
            <Circle cx="191" cy="113" r="48" fill="#FFF9EE" />
            <Rect
              x="228"
              y="101"
              width="25"
              height="19"
              rx="8"
              fill="none"
              stroke="#FFF9EE"
              strokeWidth="9"
            />
            <Circle cx="191" cy="113" r="35" fill={p.ink} />
            <Path
              d="M178 112 Q190 90 204 108 Q211 121 191 135 Q166 118 178 112"
              fill={p.background}
            />
          </G>
        ) : water ? (
          <>
            {[20, 65, 110, 155, 200].map((y) => (
              <Path
                key={y}
                d={`M-20 ${y} Q70 ${y - 45} 170 ${y} T380 ${y}`}
                fill="none"
                stroke="#F6F6E9"
                strokeWidth="16"
                opacity="0.6"
              />
            ))}
            <Ellipse
              cx="207"
              cy="125"
              rx="29"
              ry="81"
              rotation="40"
              origin="207,125"
              fill={p.ink}
            />
            <Ellipse
              cx="207"
              cy="125"
              rx="14"
              ry="52"
              rotation="40"
              origin="207,125"
              fill={p.background}
            />
            <Path
              d="M143 76 L271 177"
              stroke={p.accent}
              strokeWidth="9"
              strokeLinecap="round"
            />
          </>
        ) : movement ? (
          <>
            <G fill="none" stroke="#F8F5E8" strokeWidth="2.5" opacity="0.65">
              {[0, 22, 44, 66].map((n) => (
                <Path
                  key={n}
                  d={`M-40 ${200 + n} C100 ${240 + n} 90 ${30 + n} 235 ${60 + n} S360 ${130 + n} 410 ${-20 + n}`}
                />
              ))}
            </G>
            <Circle cx="225" cy="61" r="15" fill={p.ink} />
            <Path
              d="M207 88 L181 128 L221 153 L206 203 M183 124 L155 162 L112 170 M203 91 L243 113 L270 88 M195 91 L158 83 L133 110"
              stroke={p.ink}
              strokeWidth="15"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <Path
              d="M205 88 L182 124"
              stroke={p.accent}
              strokeWidth="25"
              strokeLinecap="round"
            />
          </>
        ) : (
          <G transform="translate(208 122)">
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <Ellipse
                key={angle}
                cx="0"
                cy="-40"
                rx="25"
                ry="54"
                rotation={angle}
                origin="0,0"
                fill={p.accent}
                opacity="0.8"
              />
            ))}
            <Circle r="26" fill={p.ink} />
            <Circle r="10" fill={p.background} />
          </G>
        )}
        <G fill={p.ink} opacity="0.35">
          <Circle cx="27" cy="25" r="2" />
          <Circle cx="35" cy="25" r="2" />
          <Circle cx="43" cy="25" r="2" />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({ container: { overflow: "hidden" } });
