import * as React from "react";
import { connect, DispatchProp } from "react-redux";
import BigNumber from "bignumber.js";
import styled from "styled-components";
import { ListingWrapper, WrappedChallengeData } from "@joincivil/core";
import {
  colors,
  VoteTypeSummaryRowProps as PartialChallengeResultsProps,
  CHALLENGE_RESULTS_VOTE_TYPES,
  ChallengeResultsProps,
  ListingHistoryEventTimestampProps,
  ProgressBarCountdownProps,
  PHASE_TYPE_NAMES,
  PHASE_TYPE_LABEL,
} from "@joincivil/components";
import { getFormattedTokenBalance } from "@joincivil/utils";
import { fetchAndAddChallengeData } from "../../actionCreators/challenges";
import { State } from "../../reducers";

const StyledPartialChallengeResultsHeader = styled.p`
  & > span {
    color: ${colors.primary.CIVIL_GRAY_2};
    font-weight: normal;
    font-size: 0.9em;
  }
`;

export interface ChallengeContainerProps {
  challengeID: BigNumber;
}

export interface ChallengeContainerReduxProps {
  challengeData?: WrappedChallengeData;
  challengeDataRequestStatus?: any;
}

export interface PhaseCountdownTimerProps {
  phaseType: string;
  listing?: ListingWrapper;
  challenge?: WrappedChallengeData;
}

export interface PhaseCountdownReduxProps {
  parameters: any;
  govtParameters: any;
}

/**
 * Generates a HO-Component Container for Challenge Succeeded/Failed Event
 * presentation components.
 * Given a `challengeID`, this container fetches the challenge data from the Redux store
 * then extracts and passes props for rendering a Challenge Results component
 */
export const connectChallengeResults = <
  TOriginalProps extends ListingHistoryEventTimestampProps & ChallengeContainerProps
>(
  PhaseCardComponent:
    | React.ComponentClass<TOriginalProps & ChallengeResultsProps>
    | React.StatelessComponent<TOriginalProps & ChallengeResultsProps>,
) => {
  const mapStateToProps = (
    state: State,
    ownProps: ListingHistoryEventTimestampProps & ChallengeContainerProps,
  ): ListingHistoryEventTimestampProps & ChallengeContainerReduxProps & ChallengeContainerProps => {
    const { challenges, challengesFetching } = state.networkDependent;
    let challengeData;
    const challengeID = ownProps.challengeID;
    if (challengeID) {
      challengeData = challenges.get(challengeID.toString());
    }
    let challengeDataRequestStatus;
    if (challengeID) {
      challengeDataRequestStatus = challengesFetching.get(challengeID.toString());
    }
    return {
      challengeData,
      challengeDataRequestStatus,
      ...ownProps,
    };
  };

  class HOChallengeResultsContainer extends React.Component<
    TOriginalProps & ChallengeContainerReduxProps & DispatchProp<any>
  > {
    public componentDidMount(): void {
      this.ensureHasChallengeData();
    }

    public componentDidUpdate(): void {
      this.ensureHasChallengeData();
    }

    public render(): JSX.Element | null {
      if (!this.props.challengeData) {
        return null;
      }

      const challenge = this.props.challengeData.challenge;
      const totalVotes = challenge.poll.votesAgainst.add(challenge.poll.votesFor);
      const votesFor = getFormattedTokenBalance(challenge.poll.votesFor);
      const votesAgainst = getFormattedTokenBalance(challenge.poll.votesAgainst);
      const percentFor = challenge.poll.votesFor
        .div(totalVotes)
        .mul(100)
        .toFixed(0);
      const percentAgainst = challenge.poll.votesAgainst
        .div(totalVotes)
        .mul(100)
        .toFixed(0);
      return (
        <>
          <PhaseCardComponent
            totalVotes={getFormattedTokenBalance(totalVotes)}
            votesFor={votesFor.toString()}
            votesAgainst={votesAgainst.toString()}
            percentFor={percentFor.toString()}
            percentAgainst={percentAgainst.toString()}
            {...this.props}
          />
        </>
      );
    }

    private ensureHasChallengeData = (): void => {
      if (!this.props.challengeData && !this.props.challengeDataRequestStatus) {
        this.props.dispatch!(fetchAndAddChallengeData(this.props.challengeID.toString()));
      }
    };
  }

  return connect(mapStateToProps)(HOChallengeResultsContainer);
};

/**
 * Generates a HO-Component Container for My Dashboard Activity Item
 * presentation components.
 * Given a `challengeID`, this container fetches the challenge data from the Redux store
 * then extracts and passes props for rendering a Partial Challenge Results component, which
 * shows only the summary for the winning vote
 */
export const connectWinningChallengeResults = <TOriginalProps extends ChallengeContainerProps>(
  PresentationComponent:
    | React.ComponentClass<PartialChallengeResultsProps>
    | React.StatelessComponent<PartialChallengeResultsProps>,
) => {
  const mapStateToProps = (
    state: State,
    ownProps: ChallengeContainerProps,
  ): ChallengeContainerReduxProps & ChallengeContainerProps => {
    const { challenges, challengesFetching } = state.networkDependent;
    let challengeData;
    const challengeID = ownProps.challengeID;
    if (challengeID) {
      challengeData = challenges.get(challengeID.toString());
    }
    let challengeDataRequestStatus;
    if (challengeID) {
      challengeDataRequestStatus = challengesFetching.get(challengeID.toString());
    }
    return {
      challengeData,
      challengeDataRequestStatus,
      ...ownProps,
    };
  };

  // @TODO(jon): Can we get rid of this additional react component and just use redux's connect? Just need to figure out the correct typing to use when not passing `challengeID` as a prop to the presentation component
  class HOChallengeResultsContainer extends React.Component<
    TOriginalProps & ChallengeContainerReduxProps & DispatchProp<any>
  > {
    public componentDidMount(): void {
      this.ensureHasChallengeData();
    }

    public componentDidUpdate(): void {
      this.ensureHasChallengeData();
    }

    public render(): JSX.Element | null {
      if (!this.props.challengeData) {
        return null;
      }

      const challenge = this.props.challengeData.challenge;
      const totalVotes = challenge.poll.votesAgainst.add(challenge.poll.votesFor);

      let label;
      let voteType;
      let votesCount;
      let votesPercent;

      if (challenge.poll.votesFor.greaterThan(challenge.poll.votesAgainst)) {
        label = (
          <>
            Challenge Succeeded: Newsroom removed from Registry<br />
            <span>Challenge ID: {this.props.challengeData.challengeID.toString()}</span>
          </>
        );
        voteType = CHALLENGE_RESULTS_VOTE_TYPES.REMOVE;
        votesCount = getFormattedTokenBalance(challenge.poll.votesFor);
        votesPercent = challenge.poll.votesFor
          .div(totalVotes)
          .mul(100)
          .toFixed(0);
      } else {
        label = (
          <>
            Challenge Failed: Newsroom remains in Registry<br />
            <span>Challenge ID: {this.props.challengeData.challengeID.toString()}</span>
          </>
        );
        voteType = CHALLENGE_RESULTS_VOTE_TYPES.REMAIN;
        votesCount = getFormattedTokenBalance(challenge.poll.votesAgainst);
        votesPercent = challenge.poll.votesAgainst
          .div(totalVotes)
          .mul(100)
          .toFixed(0);
      }

      const props = { voteType, votesCount, votesPercent };

      return (
        <>
          <StyledPartialChallengeResultsHeader>{label}</StyledPartialChallengeResultsHeader>
          <PresentationComponent {...props} />
        </>
      );
    }

    private ensureHasChallengeData = (): void => {
      if (!this.props.challengeData && !this.props.challengeDataRequestStatus) {
        this.props.dispatch!(fetchAndAddChallengeData(this.props.challengeID.toString()));
      }
    };
  }

  return connect(mapStateToProps)(HOChallengeResultsContainer);
};

/**
 * Generates a HO-Component Container for My Dashboard Activity Item
 * presentation components.
 * Given a `endTime` and `paramName`, this container fetches the phase length from
 * the parameterizer and passes the props for rendering a Phase Countdown Progress
 * bar to the presentation component
 */
export const connectPhaseCountdownTimer = <TOriginalProps extends ChallengeContainerProps>(
  PresentationComponent:
    | React.ComponentClass<ProgressBarCountdownProps>
    | React.StatelessComponent<ProgressBarCountdownProps>,
) => {
  const mapStateToProps = (
    state: State,
    ownProps: PhaseCountdownTimerProps,
  ): PhaseCountdownTimerProps & PhaseCountdownReduxProps => {
    const { parameters, govtParameters } = state.networkDependent;

    return {
      parameters,
      govtParameters,
      ...ownProps,
    };
  };

  class HOContainer extends React.Component<PhaseCountdownTimerProps & PhaseCountdownReduxProps & DispatchProp<any>> {
    public render(): JSX.Element | null {
      let displayLabel = "";
      let endTime = 0;
      let totalSeconds = 0;

      switch (this.props.phaseType) {
        case PHASE_TYPE_NAMES.CHALLENGE_COMMIT_VOTE:
          displayLabel = PHASE_TYPE_LABEL[this.props.phaseType];
          if (this.props.challenge) {
            endTime = this.props.challenge.challenge.poll.commitEndDate.toNumber();
          }
          totalSeconds = this.props.parameters.commitStageLen;
          break;
      }

      const props = {
        displayLabel,
        endTime,
        totalSeconds,
      };

      return <PresentationComponent {...props} />;
    }
  }

  return connect(mapStateToProps)(HOContainer);
};
