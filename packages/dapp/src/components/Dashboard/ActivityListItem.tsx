import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { ListingWrapper, WrappedChallengeData, UserChallengeData } from "@joincivil/core";
import { NewsroomState } from "@joincivil/newsroom-manager";
import { DashboardActivityItem, PHASE_TYPE_NAMES } from "@joincivil/components";
import { getFormattedTokenBalance } from "@joincivil/utils";
import { State } from "../../reducers";
import {
  getChallenge,
  makeGetListingPhaseState,
  makeGetListing,
  makeGetListingAddressByChallengeID,
  makeGetChallengeState,
  makeGetUserChallengeData,
} from "../../selectors";
import { WinningChallengeResults } from "./WinningChallengeResults";
import { PhaseCountdownTimer } from "./PhaseCountdownTimer";

export interface ActivityListItemOwnProps {
  listingAddress?: string;
  even: boolean;
  challenge?: WrappedChallengeData;
  userChallengeData?: UserChallengeData;
  challengeState?: any;
  user?: string;
}

export interface ChallengeActivityListItemOwnProps {
  challengeID: string;
  even: boolean;
  user?: string;
}

export interface ActivityListItemReduxProps {
  newsroom?: NewsroomState;
  listing?: ListingWrapper;
  listingPhaseState?: any;
  challengeState?: any;
}

class ActivityListItemComponent extends React.Component<ActivityListItemOwnProps & ActivityListItemReduxProps> {
  public render(): JSX.Element {
    const { listingAddress: address, listing, newsroom, listingPhaseState } = this.props;
    if (listing && listing.data && newsroom && listingPhaseState) {
      const newsroomData = newsroom.wrapper.data;
      let listingDetailURL = `/listing/${address}`;
      if (this.props.challenge) {
        listingDetailURL = `/listing/${address}/challenge/${this.props.challenge.challengeID}`;
      }
      const buttonTextTuple = this.getButtonText();
      const props = {
        newsroomName: newsroomData.name,
        listingDetailURL,
        buttonText: buttonTextTuple[0],
        buttonHelperText: buttonTextTuple[1],
      };

      return <DashboardActivityItem {...props}>{this.renderActivityDetails()}</DashboardActivityItem>;
    } else {
      return <></>;
    }
  }

  private renderActivityDetails = (): JSX.Element => {
    const { listingPhaseState, challengeState } = this.props;
    const { isWhitelisted, isInApplication, canResolveChallenge, inChallengePhase, inRevealPhase } = listingPhaseState;

    if (!this.props.challenge) {
      if (isInApplication) {
        return (
          <>
            <p>Awaiting Approval</p>
          </>
        );
      } else if (!isWhitelisted && !inChallengePhase && !isInApplication) {
        return (
          <>
            <p>Rejected from Registry</p>
          </>
        );
      } else if (inChallengePhase) {
        return (
          <>
            <p>Under Challenge > Accepting Votes</p>
            <p>{this.props.challenge!.challengeID}</p>
          </>
        );
      } else if (inRevealPhase) {
        return (
          <>
            <p>Under Challenge > Revealing Votes</p>
            <p>{this.props.challenge!.challengeID}</p>
          </>
        );
      } else if (canResolveChallenge) {
        return (
          <>
            <p>Under Challenge > Complete</p>
          </>
        );
      }
    } else {
      if (this.props.challengeState) {
        if (listingPhaseState && listingPhaseState.inCommitPhase) {
          return (
            <PhaseCountdownTimer phaseType={PHASE_TYPE_NAMES.CHALLENGE_REVEAL_VOTE} challenge={this.props.challenge} />
          );
        }

        if (listingPhaseState && listingPhaseState.inRevealPhase) {
          return (
            <PhaseCountdownTimer phaseType={PHASE_TYPE_NAMES.CHALLENGE_REVEAL_VOTE} challenge={this.props.challenge} />
          );
        }

        if (challengeState.isResolved) {
          return (
            <>
              <WinningChallengeResults challengeID={this.props.challenge.challengeID} />
            </>
          );
        }
      }
    }

    return <></>;
  };

  private getButtonText = (): [string, string | JSX.Element | undefined] => {
    const { listingAddress, listingPhaseState, userChallengeData } = this.props;
    if (userChallengeData) {
      const {
        didUserCommit,
        didUserReveal,
        isVoterWinner,
        didUserCollect,
        didCollectAmount,
        didUserRescue,
      } = userChallengeData;

      if (didUserReveal && isVoterWinner && !didUserCollect) {
        return ["Claim Rewards", "You voted for the winner"];
      } else if (didUserReveal && !isVoterWinner) {
        return ["Claim Rewards", "You did not vote for the winner"];
      } else if (didUserCommit && !didUserReveal && !didUserRescue) {
        return ["Rescue Tokens", "You did not reveal your vote"];
      } else if (didUserRescue) {
        return ["View Results", "You rescued your tokens"];
      } else if (didUserCollect) {
        const reward = getFormattedTokenBalance(didCollectAmount!);
        return ["View Results", `You collected ${reward}`];
      }
    }

    if (listingPhaseState && listingPhaseState.inRevealPhase && userChallengeData && userChallengeData.didUserCommit) {
      return ["Reveal Vote", undefined];
    }

    if (listingPhaseState && listingPhaseState.canResolveChallenge) {
      return ["Resolve Challenge", undefined];
    }

    // This is a listing
    if (!userChallengeData && listingAddress) {
      const manageNewsroomUrl = `/mgmt-v1/${this.props.listingAddress}`;
      return ["View", <Link to={manageNewsroomUrl}>Manage Newsroom</Link>];
    }

    return ["View", undefined];
  };
}

const makeMapStateToProps = () => {
  const getListingPhaseState = makeGetListingPhaseState();
  const getListing = makeGetListing();

  const mapStateToProps = (
    state: State,
    ownProps: ActivityListItemOwnProps,
  ): ActivityListItemReduxProps & ActivityListItemOwnProps => {
    const { newsrooms } = state;
    const { user } = state.networkDependent;
    const newsroom = ownProps.listingAddress ? newsrooms.get(ownProps.listingAddress) : undefined;
    const listing = getListing(state, ownProps);

    let userAcct = ownProps.user;
    if (!userAcct) {
      userAcct = user.account.account;
    }

    return {
      newsroom,
      listing,
      listingPhaseState: getListingPhaseState(state, ownProps),
      ...ownProps,
    };
  };

  return mapStateToProps;
};

export const ActivityListItem = connect(makeMapStateToProps)(ActivityListItemComponent);

const makeChallengeMapStateToProps = () => {
  const getListingAddressByChallengeID = makeGetListingAddressByChallengeID();
  const getChallengeState = makeGetChallengeState();
  const getUserChallengeData = makeGetUserChallengeData();

  const mapStateToProps = (state: State, ownProps: ChallengeActivityListItemOwnProps): ActivityListItemOwnProps => {
    const listingAddress = getListingAddressByChallengeID(state, ownProps);
    const challenge = getChallenge(state, ownProps);
    const userChallengeData = getUserChallengeData(state, ownProps);
    const challengeState = getChallengeState(state, ownProps);
    const { even, user } = ownProps;

    return {
      listingAddress,
      challenge,
      challengeState,
      userChallengeData,
      even,
      user,
    };
  };

  return mapStateToProps;
};

/**
 * Container that renders a listing associated with the specified `ChallengeID`
 */
export class ChallengeListingItemComponent extends React.Component<
  ChallengeActivityListItemOwnProps & ActivityListItemOwnProps
> {
  public render(): JSX.Element {
    return <ActivityListItem {...this.props} />;
  }
}

export const ChallengeActivityListItem = connect(makeChallengeMapStateToProps)(ChallengeListingItemComponent);
