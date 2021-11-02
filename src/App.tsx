import clsx from "clsx";
import Fuse from "fuse.js";
import React, { useCallback, useEffect, useMemo, useState } from "react";

function nextItemInCycle<Item>(items: Array<Item>, item: Item) {
  const index = items.indexOf(item);
  if (index === -1) {
    throw new Error("Item should be in items");
  }

  const isLastItem = index === items.length - 1;

  if (isLastItem) {
    return items[0];
  } else {
    return items[index + 1];
  }
}

function previousItemInCycle<Item>(items: Array<Item>, item: Item) {
  const index = items.indexOf(item);
  if (index === -1) {
    throw new Error("Item should be in items");
  }

  if (index === 0) {
    return items[items.length - 1];
  } else {
    return items[index - 1];
  }
}

function App() {
  const [input, setInput] = useState("");
  const [tabs, setTabs] = useState<Array<chrome.tabs.Tab>>([]);
  const [selectedTabId, setSelectedTabId] = useState<number | undefined>(
    tabs[0]?.id
  );

  const searchTab = useCallback((input: string) => {
    chrome.tabs.query({}, (tabs) => {
      const fuse = new Fuse(tabs, {
        keys: ["title", "url"],
        threshold: 0.3, // 1 means anything matches, and 0 means nothing matches
      });
      const foundTabs = fuse.search(input).map((result) => result.item);
      setTabs(foundTabs);
      setSelectedTabId(foundTabs[0]?.id);
    });
  }, []);

  const updateInput = useCallback(
    (newInput: string) => {
      setInput(newInput);
      searchTab(newInput);
    },
    [searchTab]
  );

  const selectedTab = useMemo(() => {
    return tabs.find(
      (tab) => selectedTabId && tab.id && tab.id === selectedTabId
    );
  }, [tabs, selectedTabId]);

  const updateActiveTab = useCallback((selectedTab: chrome.tabs.Tab) => {
    if (selectedTab && selectedTab.id) {
      chrome.tabs.update(selectedTab.id, { active: true });
    }
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!selectedTab) return;

      if (event.key === "ArrowDown") {
        const nextItem = nextItemInCycle(tabs, selectedTab) || selectedTab;
        setSelectedTabId(nextItem.id);
      }

      if (event.key === "ArrowUp") {
        const previousItem =
          previousItemInCycle(tabs, selectedTab) || selectedTab;
        setSelectedTabId(previousItem.id);
      }

      if (event.key === "Enter") {
        updateActiveTab(selectedTab);
      }
    },
    [tabs, selectedTab, updateActiveTab]
  );

  useEffect(() => {
    document.body.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.removeEventListener("keydown", handleKeyDown);
    };
  });

  return (
    <div className="bg-white h-full w-full p-2">
      <input
        type="text"
        autoFocus
        className="px-2 py-1 block w-full text-2xl ring-0 outline-none"
        onChange={(event) => updateInput(event.target.value)}
        value={input}
      />
      {tabs.length > 0 ? (
        <div className="mt-2">
          {tabs.map((tab) => {
            const isSelected = selectedTabId && selectedTabId === tab.id;
            return (
              <div
                onClick={() => {
                  updateActiveTab(tab);
                }}
                onMouseOver={() => {
                  setSelectedTabId(tab.id);
                }}
                className={clsx(
                  "px-2 py-1 flex flex-row items-center cursor-default",
                  {
                    "bg-gray-200": isSelected,
                  }
                )}
              >
                <div>{tab.title}</div>
                <div className="flex-grow ml-auto mr-auto w-1.5" />
                <div
                  className="text-gray-400 italic ml-auto overflow-ellipsis whitespace-nowrap overflow-hidden"
                  style={{
                    maxWidth: "15rem",
                    minWidth: "15rem",
                  }}
                  title={tab.url}
                >
                  {tab.url}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default App;
