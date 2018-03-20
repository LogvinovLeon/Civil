import { setNewsroomListeners } from "./listeners";
import { Civil, ListingState } from "@joincivil/core";

// Metamask is injected after full load
window.addEventListener("load", async () => {
  setNewsroomListeners();

  const civil = new Civil({ debug: true });
  const tcr = await civil.getDeployedOwnedAddressTCRWithAppeals();

  const urlString = window.location.href;
  const url = new URL(urlString);
  const address = url.searchParams.get("address")!;
  const state = await tcr.getListingState(address);

  const displayState = document.getElementById("state")!;
  displayState.innerHTML = "State: " + ListingState[state].toString();
});
