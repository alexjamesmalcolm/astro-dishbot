import classes from "classnames";
import { PREVIOUS_PAGE_KEY } from "@utils/const";
import type { ChoreRotation } from "@utils/redis";
import { createSignal } from "solid-js";

export default function NavbarContents({
  rotations,
  username,
  currentPage,
}: {
  rotations: ChoreRotation[];
  username: string | undefined;
  currentPage: string;
}) {
  const hasRotations = rotations.length > 0;
  const [isActive, setIsActive] = createSignal(false);
  return (
    <nav class="navbar is-fixed-top">
      <div class="navbar-brand">
        <a class="navbar-item" href="/">
          <img src="/android-chrome-512x512.png" />
          Dishbot
        </a>
        <a
          role="button"
          class={classes("navbar-burger", { "is-active": isActive() })}
          aria-label="menu"
          aria-expanded={isActive() ? "true" : "false"}
          onClick={() => setIsActive((previous) => !previous)}
        >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </a>
      </div>
      <div class={classes("navbar-menu", { "is-active": isActive() })}>
        <div class="navbar-start">
          <div
            class={classes("navbar-item", {
              "has-dropdown is-hoverable": hasRotations,
            })}
          >
            <a
              class={classes({ "navbar-link": hasRotations })}
              href="/chore-rotation/"
            >
              Rotations
            </a>
            {hasRotations && (
              <div class="navbar-dropdown">
                {rotations.map((rotation) => (
                  <a
                    class="navbar-item"
                    href={`/chore-rotation/${rotation.id}/`}
                  >
                    {rotation.details.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
        {username && (
          <div class="navbar-end">
            <div class="navbar-item has-dropdown is-hoverable">
              <span class="navbar-link">{username}</span>
              <div class="navbar-dropdown">
                <div class="navbar-item">
                  <form action="/auth/logout/" method="post">
                    <input
                      type="hidden"
                      name={PREVIOUS_PAGE_KEY}
                      value={currentPage}
                    />
                    <button class="button is-warning" type="submit">
                      Sign Out
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
