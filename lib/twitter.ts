import querystring from "querystring";
import { getTwitterMedia } from "./twitter-media";
import {Tweet} from "@/types/twitter";

export const getTweets = async (id: number) => {
  const queryParams = querystring.stringify({
    expansions:
      "author_id,attachments.media_keys,referenced_tweets.id,referenced_tweets.id.author_id,attachments.poll_ids",
    "tweet.fields":
      "attachments,author_id,public_metrics,created_at,id,in_reply_to_user_id,referenced_tweets,text,entities",
    "user.fields": "id,name,profile_image_url,protected,url,username,verified",
    "media.fields":
      "duration_ms,height,media_key,preview_image_url,type,url,width,public_metrics",
    "poll.fields": "duration_minutes,end_datetime,id,options,voting_status",
  });

  const response = await fetch(
    `https://api.twitter.com/2/tweets/${id}?${queryParams}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.TWITTER_AUTH_TOKEN}`,
      },
    }
  );

  const tweet = await response.json();

  const getAuthorInfo = (author_id: string) => {
    return tweet.includes.users.find((user: Record<string, any>) => user.id === author_id);
  };

  const getReferencedTweets = (mainTweet: Tweet) => {
    return (
      mainTweet?.referenced_tweets?.map((referencedTweet: Tweet) => {
        const fullReferencedTweet = tweet.includes.tweets.find(
          (tweet: Tweet) => tweet.id === referencedTweet.id
        );

        return {
          type: referencedTweet.type,
          author: getAuthorInfo(fullReferencedTweet.author_id),
          ...fullReferencedTweet,
        };
      }) || []
    );
  };

  // function to distinguish between external URLs and external t.co links and internal t.co links
  // (e.g. images, videos, gifs, quote tweets) and remove/replace them accordingly
  const getExternalUrls = (tweet: Tweet) => {
    const externalURLs = tweet?.entities?.urls;
    const mappings = {};
    if (externalURLs) {
      externalURLs.map((url: { url: any; display_url: string; expanded_url: any; }) => {
        mappings[`${url.url}`] =
          !url.display_url.startsWith("pic.twitter.com") &&
          !url.display_url.startsWith("twitter.com")
            ? url.expanded_url
            : "";
      });
    }
    let processedText = tweet?.text;
    Object.entries(mappings).map(([k, v], i) => {
      processedText = processedText.replace(k, v);
    });
    return processedText;
  };
  if (tweet.data) tweet.data.text = getExternalUrls(tweet?.data); // removing/replacing t.co links for main tweet
  tweet?.includes?.tweets?.map((twt: Tweet) => {
    // removing/replacing t.co links for referenced tweets
    twt.text = getExternalUrls(twt);
  });

  const media = tweet.data?.attachments?.media_keys?.map((key: string) =>
    tweet.includes.media.find((media: any) => media.media_key === key)
  );

  const referenced_tweets = getReferencedTweets(tweet.data);

  return {
    ...tweet.data,
    media: media || [],
    video:
      media && (media[0].type === "video" || media[0].type === "animated_gif")
        ? await getTwitterMedia(id)
        : null,
    polls: tweet?.includes?.polls,
    url_meta:
      media || referenced_tweets.length > 0
        ? null
        : tweet.data?.entities?.urls[0],
    referenced_tweets: referenced_tweets,
    author: getAuthorInfo(tweet.data?.author_id),
  };
};
