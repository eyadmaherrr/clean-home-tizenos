import { useEffect, useState } from "react";
import { TopBar } from "../../components/navigation/TopBar";
import { Focusable } from "../../components/navigation/Focusable";
import { useScreenFocus } from "../../platform/remote/useScreenFocus";
import { PRAYERS, PrayerService, minutesOf, to12, type Place, type PrayerDay } from "../../services/prayer/PrayerService";

/** Today's five prayers and sunrise; the next one is highlighted with a countdown. */
export function PrayerScreen() {
  useScreenFocus("prayer");
  const [data, setData] = useState<{ place: Place; day: PrayerDay } | null>(null);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const load = () => {
    setError(false);
    PrayerService.today().then(setData, () => setError(true));
  };

  useEffect(load, []);
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 20000);
    return () => window.clearInterval(t);
  }, []);

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const prayers = PRAYERS.filter((p) => p.prayer);
  let next = data ? prayers.find((p) => minutesOf(data.day.times[p.key]) > nowMin) : undefined;
  const tomorrow = !!data && !next;
  if (data && !next) next = prayers[0];
  let until = 0;
  if (data && next) {
    until = minutesOf(data.day.times[next.key]) - nowMin;
    if (tomorrow) until += 24 * 60;
  }

  return (
    <div className="screen prayer">
      <TopBar />
      <div className="prayer-body">
        {!data ? (
          <div className="prayer-wait">
            {error ? (
              <>
                <div>Couldn't load prayer times. Check the internet connection.</div>
                <Focusable id="prayer-retry" group="prayer" className="btn btn-glass prayer-retry" isDefault onSelect={load}>Try Again</Focusable>
              </>
            ) : "Loading prayer times…"}
          </div>
        ) : (
          <>
            <div className="prayer-head">
              <div className="ph-date">{data.day.weekday} · {data.day.hijri}{data.place.city ? " · " + data.place.city : ""}</div>
              {next ? (
                <>
                  <div className="ph-next-label">Next Prayer{tomorrow ? " (tomorrow)" : ""}</div>
                  <div className="ph-next"><span lang="ar" className="ph-next-ar">{next.ar}</span> {next.en}</div>
                  <div className="ph-in">in {Math.floor(until / 60) ? Math.floor(until / 60) + "h " : ""}{until % 60}m</div>
                </>
              ) : null}
            </div>
            <div className="prayer-row">
              {PRAYERS.map((p) => {
                const t = to12(data.day.times[p.key]);
                const isNext = next && p.key === next.key;
                const past = !tomorrow && minutesOf(data.day.times[p.key]) <= nowMin;
                return (
                  <Focusable key={p.key} id={"pr-" + p.key} group="prayer" isDefault={!!isNext}
                    className={"prayer-card glass-tile" + (isNext ? " is-next" : "") + (past ? " is-past" : "") + (p.prayer ? "" : " is-minor")}>
                    <div className="pc-ar" lang="ar">{p.ar}</div>
                    <div className="pc-en">{p.en}</div>
                    <div className="pc-time">{t.time}<span className="pc-ap">{t.ap}</span></div>
                  </Focusable>
                );
              })}
            </div>
            <div className="prayer-source">Egyptian General Authority of Survey · AlAdhan</div>
          </>
        )}
      </div>
    </div>
  );
}
