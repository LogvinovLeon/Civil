import * as React from "react";
import { Set } from "immutable";
import { ChallengeActivityListItem, ActivityListItem } from "./ActivityListItem";

export interface ActivityListOwnProps {
  listings?: Set<string>;
  challenges?: Set<string>;
}

class ActivityList extends React.Component<ActivityListOwnProps> {
  constructor(props: any) {
    super(props);
  }

  public render(): JSX.Element {
    let index = 0;
    return (
      <>
        {this.props.listings &&
          this.props.listings.map(l => {
            index++;
            return <ActivityListItem key={l} listingAddress={l!} even={index % 2 === 0} />;
          })}
        {this.props.challenges &&
          this.props.challenges.map(c => {
            index++;
            return <ChallengeActivityListItem key={c} challengeID={c!} even={index % 2 === 0} />;
          })}
      </>
    );
  }
}

export default ActivityList;
