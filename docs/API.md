# Advocu Personal API

Extracted from the saved Advocu settings page (Advocu Personal API), 25 Sep 2026.
Source: `~/Downloads/advocu-api.html`. This is the in-app docs, not a public OpenAPI spec.

Program in the saved page: **GDE**. Every path below is relative to the base URL.

## Authentication

| | |
| --- | --- |
| Base URL | `https://api.advocu.com/personal-api/v1/gde` |
| Content-Type | `application/json` |
| Authorization | `Bearer {access-token}` |

The user generates the token in the Advocu portal on this settings page ("Generate your token"). The saved page does not include the token value, and it does not document a generate-token HTTP route. Token creation is a portal action. This API only consumes the token.

## Rate limits

- 30 requests per minute, per IP address.
- Over the limit, the origin returns **HTTP 429**.

## Endpoints

| Method | Path | What it does |
| --- | --- | --- |
| `GET` | `/activities` | Returns a pageable list of activities, sorted by submission date in ascending order. |
| `PATCH` | `/activities/{activityId}` | Allows updating an activity. |
| `POST` | `/activity-drafts/content-creation` | Allows creating an activity draft. |
| `POST` | `/activity-drafts/interaction-with-googlers` | Allows creating an activity draft. |
| `POST` | `/activity-drafts/mentoring` | Allows creating an activity draft. |
| `POST` | `/activity-drafts/product-feedback-given` | Allows creating an activity draft. |
| `POST` | `/activity-drafts/public-speaking` | Allows creating an activity draft. |
| `POST` | `/activity-drafts/stories` | Allows creating an activity draft. |
| `POST` | `/activity-drafts/workshop` | Allows creating an activity draft. |

Draft routes create a **draft**, not a submitted activity. The response is only the new draft id.

Read-only activity types on `GET /activities` (no draft route and no update model in this page): `github-repository`, `youtube-video`.

Not in the saved page, so not assumed: error body shape, pagination totals, a submit-draft route, a token-generation route.

## Activities

Fetch and update activities already on the platform.

### `GET /activities`

Returns a pageable list of activities, sorted by submission date in ascending order.

#### Query parameters

| Name | Type | Description | Default value |
| --- | --- | --- | --- |
| `from` | string | Filter by submission date from (inclusive), e.g. 2026-01-01T00:00:00Z | - |
| `to` | string | Filter by submission date to (exclusive), e.g. 2026-01-01T00:00:00Z | - |
| `updatedAfter` | string | Filter activities updated after this date, e.g. 2026-01-01T00:00:00Z | - |
| `page` | integer | Page number (cannot be negative) | 0 |
| `size` | integer | Page size (1-100) | 10 |

#### Response

| Name | Type | Description |
| --- | --- | --- |
| `content` | array[Activity] | - |

#### Response models

##### `Activity`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `type` | string | - | - | enum: `content-creation`, `github-repository`, `interaction-with-googlers`, `mentoring`, `product-feedback-given`, `public-speaking`, `stories`, `workshop`, `youtube-video` |
| `data` | ActivityData | - | - | - |
| `submissionDate` | string | e.g. 2026-01-01T00:00:00Z | - | - |
| `updatedDate` | string | e.g. 2026-01-01T00:00:00Z | - | - |
| `archiveDate` (optional) | string | e.g. 2026-01-01T00:00:00Z | - | - |
| `activityId` | string | - | - | - |

##### `ActivityData` — `content-creation`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `contentType` | string | Content type | - | enum: `Articles`, `Books`, `Code contribution`, `Demos`, `Newsletters`, `Podcasts`, `Videos` |
| `title` | string | What was the title? | - | max length 200; min length 3 |
| `description` | string | What was it about? | - | max length 20000 |
| `description_plain_text` | string | - | - | max length 2000 |
| `tags` (optional) | array | Tags | - | enum [318 values], see [Shared tag enums](#shared-tag-enums); min items 0 |
| `metrics` | Metrics | - | - | - |
| `activityDate` | string | Date published | - | pattern ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ |
| `activityUrl` | string | Link to Content | - | max length 500; pattern ^https?:\/\/(www\.)?.*$ |
| `imageUrl` (optional) | string | Please provide an image for your activity | - | max length 500 |
| `additionalInfo` (optional) | string | Additional information | - | max length 20000 |
| `additionalInfo_plain_text` (optional) | string | - | - | max length 2000 |
| `private` | boolean | Do you want to make this activity private? | - | - |

##### `Metrics` — `content-creation`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `readers` | integer | How many people read your content? | - | minimum 1 |

##### `ActivityData` — `github-repository`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `title` | string | - | - | max length 200 |
| `description` | string | - | - | max length 1000 |
| `activityUrl` | string | - | - | max length 500; pattern ^https?:\/\/(www\.)?.*$ |
| `activityDate` | string | - | - | pattern ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ |
| `metrics` | Metrics | - | - | - |
| `labels` | array | Used topics | - | max items 50 |
| `repositoryData` | RepositoryData | - | - | - |
| `available` | boolean | - | - | - |

##### `Metrics` — `github-repository`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `stars` | integer | - | - | minimum 0 |
| `forks` | integer | - | - | minimum 0 |
| `watching` | integer | - | - | minimum 0 |

##### `RepositoryData` — `github-repository`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `id` | string | - | - | max length 50 |
| `repository` | string | - | - | max length 100 |
| `owner` | string | - | - | max length 100 |

##### `ActivityData` — `interaction-with-googlers`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `title` | string | Title | - | max length 200; min length 3 |
| `description` | string | Description | - | max length 20000 |
| `description_plain_text` | string | - | - | max length 2000 |
| `format` | string | Format | - | enum: `Survey`, `Video feedback`, `In-person feedback sessions`, `Online feedback sessions`, `Feedback summits`, `User study / focus group`, `Feedback submissions`, `Other` |
| `interactionType` | string | Interaction Type | - | enum: `Product feedback (research studies, roadmap input, Customer Advisory Boards, EAP)`, `File bugs / help out with finding bugs`, `GitHub`, `Stack Overflow`, `Industry`, `Other interactions with Google Product Teams` |
| `tags` (optional) | array | Tags | - | enum [318 values], see [Shared tag enums](#shared-tag-enums); min items 0 |
| `metrics` | Metrics | - | - | - |
| `activityDate` | string | Interaction Date | - | pattern ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ |
| `imageUrl` (optional) | string | Please provide an image for your activity | - | max length 500 |
| `additionalInfo` (optional) | string | Additional information | - | max length 20000 |
| `additionalInfo_plain_text` (optional) | string | - | - | max length 2000 |
| `additionalLinks` (optional) | string | Additional links | - | max length 20000 |
| `additionalLinks_plain_text` (optional) | string | - | - | max length 2000 |
| `private` | boolean | Do you want to make this activity private? | - | - |

##### `Metrics` — `interaction-with-googlers`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `timeSpent` | integer | Time spent (in minutes) | - | minimum 1 |

##### `ActivityData` — `mentoring`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `title` | string | What was the name of your mentoring session? | - | max length 200; min length 3 |
| `description` | string | What was it about? | - | max length 20000 |
| `description_plain_text` | string | - | - | max length 2000 |
| `tags` (optional) | array | Tags | - | enum [318 values], see [Shared tag enums](#shared-tag-enums); min items 0 |
| `metrics` | Metrics | - | - | - |
| `eventFormat` | string | Select event format | - | enum: `In-Person`, `Virtual`, `Hybrid` |
| `country` (conditional) | string | Country | `eventFormat` is `In-Person` or `Hybrid` | max length 100; min length 1 |
| `countryIso` (optional) | string | - | - | max length 2; min length 2 |
| `city` (conditional) | string | City | `eventFormat` is `In-Person` or `Hybrid` | max length 100; min length 1 |
| `cityPlaceId` (optional) | string | - | - | max length 500; min length 1 |
| `cityState` (optional) | string | - | - | max length 100; min length 1 |
| `inPersonAttendees` (conditional) | integer | Out of all, how many people attended your session in-person? | `eventFormat` is `Hybrid` | minimum 0 |
| `activityDate` | string | Date of your mentoring session | - | pattern ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ |
| `activityUrl` (optional) | string | Share the event link (e.g. Accelerator or Solution Challenge website, gdg.community.dev event URL, program website,etc) or any other relevant link | - | max length 500; pattern ^https?:\/\/(www\.)?.*$ |
| `imageUrl` (optional) | string | Please provide an image for your activity | - | max length 500 |
| `additionalInfo` (optional) | string | Additional information | - | max length 20000 |
| `additionalInfo_plain_text` (optional) | string | - | - | max length 2000 |
| `private` | boolean | Do you want to make this activity private? | - | - |

##### `Metrics` — `mentoring`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `attendees` | integer | How many people have been mentored in total? | - | minimum 1 |

##### `ActivityData` — `product-feedback-given`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `title` | string | Title | - | max length 200; min length 3 |
| `description` | string | Description | - | max length 20000 |
| `description_plain_text` | string | - | - | max length 2000 |
| `contentType` | string | Content type | - | enum: `Early access program`, `Product feedback session` |
| `productDescription` | string | What product was it about? | - | max length 5000 |
| `productDescription_plain_text` | string | - | - | max length 500 |
| `tags` (optional) | array | Tags | - | enum [318 values], see [Shared tag enums](#shared-tag-enums); min items 0 |
| `metrics` | Metrics | - | - | - |
| `activityDate` | string | Participation Date | - | pattern ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ |
| `imageUrl` (optional) | string | Please provide an image for your activity | - | max length 500 |
| `additionalInfo` (optional) | string | Additional information | - | max length 20000 |
| `additionalInfo_plain_text` (optional) | string | - | - | max length 2000 |
| `private` | boolean | Do you want to make this activity private? | - | - |

##### `Metrics` — `product-feedback-given`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `timeSpent` | integer | Time spent (in minutes) | - | minimum 1 |

##### `ActivityData` — `public-speaking`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `title` | string | What was the title of your talk? | - | max length 200; min length 3 |
| `description` | string | What was it about? | - | max length 20000 |
| `description_plain_text` | string | - | - | max length 2000 |
| `tags` (optional) | array | Tags | - | enum [318 values], see [Shared tag enums](#shared-tag-enums); min items 0 |
| `metrics` | Metrics | - | - | - |
| `eventFormat` | string | Select event format | - | enum: `In-Person`, `Virtual`, `Hybrid` |
| `country` (conditional) | string | Country | `eventFormat` is `In-Person` or `Hybrid` | max length 100; min length 1 |
| `countryIso` (optional) | string | - | - | max length 2; min length 2 |
| `city` (conditional) | string | City | `eventFormat` is `In-Person` or `Hybrid` | max length 100; min length 1 |
| `cityPlaceId` (optional) | string | - | - | max length 500; min length 1 |
| `cityState` (optional) | string | - | - | max length 100; min length 1 |
| `inPersonAttendees` (conditional) | integer | Out of all, how many people attended your session in-person? | `eventFormat` is `Hybrid` | minimum 0 |
| `activityDate` | string | Date of your talk | - | pattern ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ |
| `activityUrl` | string | Share the event link (if it's a GDG event, the gdg.community.dev event URL) or any other relevant link | - | max length 500; pattern ^https?:\/\/(www\.)?.*$ |
| `additionalInfo` (optional) | string | Additional information | - | max length 20000 |
| `additionalInfo_plain_text` (optional) | string | - | - | max length 2000 |
| `imageUrl` (optional) | string | Please provide an image for your activity | - | max length 500 |
| `private` | boolean | Do you want to make this activity private? | - | - |

##### `Metrics` — `public-speaking`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `attendees` | integer | How many people attended your session in total? | - | minimum 1 |

##### `ActivityData` — `stories`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `title` | string | Title of the story | - | max length 200; min length 3 |
| `description` | string | Description | - | max length 20000 |
| `description_plain_text` | string | - | - | max length 2000 |
| `whyIsSignificant` | string | Tell us more about it and why it is significant | - | max length 20000 |
| `whyIsSignificant_plain_text` | string | - | - | max length 2000 |
| `significanceType` | string | Significance type | - | enum: `Diversity & Inclusion`, `Helping Business`, `Social Impact`, `Feedback to Google`, `Community Leading`, `Technology / Open source` |
| `activityUrl` | string | Link | - | max length 500; pattern ^https?:\/\/(www\.)?.*$ |
| `tags` (optional) | array | Tags | - | enum [318 values], see [Shared tag enums](#shared-tag-enums); min items 0 |
| `metrics` | Metrics | - | - | - |
| `imageUrl` (optional) | string | Please provide an image for your activity | - | max length 500 |
| `additionalInfo` (optional) | string | Additional information | - | max length 20000 |
| `additionalInfo_plain_text` (optional) | string | - | - | max length 2000 |
| `private` | boolean | Do you want to make this activity private? | - | - |

##### `Metrics` — `stories`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `impact` | integer | What was your impact in views, reads, attendees, etc.? Add a number below: | - | minimum 1 |

##### `ActivityData` — `workshop`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `title` | string | What was the name of your workshop session? | - | max length 200; min length 3 |
| `description` | string | What was it about? | - | max length 20000 |
| `description_plain_text` | string | - | - | max length 2000 |
| `tags` (optional) | array | Tags | - | enum [318 values], see [Shared tag enums](#shared-tag-enums); min items 0 |
| `metrics` | Metrics | - | - | - |
| `eventFormat` | string | Select event format | - | enum: `In-Person`, `Virtual`, `Hybrid` |
| `country` (conditional) | string | Country | `eventFormat` is `In-Person` or `Hybrid` | max length 100; min length 1 |
| `countryIso` (optional) | string | - | - | max length 2; min length 2 |
| `city` (conditional) | string | City | `eventFormat` is `In-Person` or `Hybrid` | max length 100; min length 1 |
| `cityPlaceId` (optional) | string | - | - | max length 500; min length 1 |
| `cityState` (optional) | string | - | - | max length 100; min length 1 |
| `inPersonAttendees` (conditional) | integer | Out of all, how many people attended your session in-person? | `eventFormat` is `Hybrid` | minimum 0 |
| `activityDate` | string | Date of your workshop | - | pattern ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ |
| `activityUrl` (optional) | string | Share the event link (if it's a GDG event, the gdg.community.dev event URL) or any other relevant link | - | max length 500; pattern ^https?:\/\/(www\.)?.*$ |
| `imageUrl` (optional) | string | Please provide an image for your activity | - | max length 500 |
| `additionalInfo` (optional) | string | Additional information | - | max length 20000 |
| `additionalInfo_plain_text` (optional) | string | - | - | max length 2000 |
| `private` | boolean | Do you want to make this activity private? | - | - |

##### `Metrics` — `workshop`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `attendees` | integer | How many people have been trained? | - | minimum 1 |

##### `ActivityData` — `youtube-video`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `title` | string | - | - | max length 200; min length 1 |
| `description` | string | - | - | max length 10000 |
| `description_plain_text` (optional) | string | - | - | max length 10000 |
| `activityUrl` | string | - | - | max length 500; pattern ^https?:\/\/(www\.)?.*$ |
| `activityDate` | string | - | - | pattern ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ |
| `metrics` | Metrics | - | - | - |
| `imageUrl` (optional) | string | - | - | max length 500; pattern ^https?:\/\/(www\.)?.*$ |
| `videoData` | VideoData | - | - | - |
| `available` | boolean | - | - | - |

##### `Metrics` — `youtube-video`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `views` | integer | - | - | minimum 0 |
| `likes` | integer | - | - | minimum 0 |
| `comments` | integer | - | - | minimum 0 |

##### `VideoData` — `youtube-video`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `id` | string | - | - | max length 50 |

### `PATCH /activities/{activityId}`

Allows updating an activity.

#### Path variables

| Name | Description |
| --- | --- |
| `activityId` | Activity id. |

#### Request body

| Name | Type | Description | Accepted if | Restrictions |
| --- | --- | --- | --- | --- |
| `data` | ActivityUpdateData | - | - | - |

#### Request models

##### `ActivityUpdateData` — `content-creation`

| Name | Type | Description | Accepted if | Restrictions |
| --- | --- | --- | --- | --- |
| `contentType` (optional) | string | Content type | - | enum: `Articles`, `Books`, `Code contribution`, `Demos`, `Newsletters`, `Podcasts`, `Videos` |
| `title` (optional) | string | What was the title? | - | max length 200; min length 3 |
| `description` (optional) | string | What was it about? | - | max length 2000 |
| `tags` (optional) | array | Tags | - | enum [318 values], see [Shared tag enums](#shared-tag-enums); min items 0 |
| `metrics` (optional) | Metrics | - | - | - |
| `activityDate` (optional) | string | Date published | - | pattern ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ |
| `activityUrl` (optional) | string | Link to Content | - | max length 500; pattern ^https?:\/\/(www\.)?.*$ |
| `additionalInfo` (optional) | string | Additional information | - | max length 2000 |
| `private` (optional) | boolean | Do you want to make this activity private? | - | - |

##### `Metrics` — `content-creation`

| Name | Type | Description | Accepted if | Restrictions |
| --- | --- | --- | --- | --- |
| `readers` (optional) | integer | How many people read your content? | - | minimum 1 |

##### `ActivityUpdateData` — `interaction-with-googlers`

| Name | Type | Description | Accepted if | Restrictions |
| --- | --- | --- | --- | --- |
| `title` (optional) | string | Title | - | max length 200; min length 3 |
| `description` (optional) | string | Description | - | max length 2000 |
| `format` (optional) | string | Format | - | enum: `Survey`, `Video feedback`, `In-person feedback sessions`, `Online feedback sessions`, `Feedback summits`, `User study / focus group`, `Feedback submissions`, `Other` |
| `interactionType` (optional) | string | Interaction Type | - | enum: `Product feedback (research studies, roadmap input, Customer Advisory Boards, EAP)`, `File bugs / help out with finding bugs`, `GitHub`, `Stack Overflow`, `Industry`, `Other interactions with Google Product Teams` |
| `tags` (optional) | array | Tags | - | enum [318 values], see [Shared tag enums](#shared-tag-enums); min items 0 |
| `metrics` (optional) | Metrics | - | - | - |
| `activityDate` (optional) | string | Interaction Date | - | pattern ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ |
| `additionalInfo` (optional) | string | Additional information | - | max length 2000 |
| `additionalLinks` (optional) | string | Additional links | - | max length 2000 |
| `private` (optional) | boolean | Do you want to make this activity private? | - | - |

##### `Metrics` — `interaction-with-googlers`

| Name | Type | Description | Accepted if | Restrictions |
| --- | --- | --- | --- | --- |
| `timeSpent` (optional) | integer | Time spent (in minutes) | - | minimum 1 |

##### `ActivityUpdateData` — `mentoring`

| Name | Type | Description | Accepted if | Restrictions |
| --- | --- | --- | --- | --- |
| `title` (optional) | string | What was the name of your mentoring session? | - | max length 200; min length 3 |
| `description` (optional) | string | What was it about? | - | max length 2000 |
| `tags` (optional) | array | Tags | - | enum [318 values], see [Shared tag enums](#shared-tag-enums); min items 0 |
| `metrics` (optional) | Metrics | - | - | - |
| `eventFormat` (optional) | string | Select event format | - | enum: `In-Person`, `Virtual`, `Hybrid` |
| `country` (optional) | string | Country | `eventFormat` is `In-Person` or `Hybrid` | max length 100; min length 1 |
| `inPersonAttendees` (optional) | integer | Out of all, how many people attended your session in-person? | `eventFormat` is `Hybrid` | minimum 0 |
| `activityDate` (optional) | string | Date of your mentoring session | - | pattern ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ |
| `activityUrl` (optional) | string | Share the event link (e.g. Accelerator or Solution Challenge website, gdg.community.dev event URL, program website,etc) or any other relevant link | - | max length 500; pattern ^https?:\/\/(www\.)?.*$ |
| `additionalInfo` (optional) | string | Additional information | - | max length 2000 |
| `private` (optional) | boolean | Do you want to make this activity private? | - | - |

##### `Metrics` — `mentoring`

| Name | Type | Description | Accepted if | Restrictions |
| --- | --- | --- | --- | --- |
| `attendees` (optional) | integer | How many people have been mentored in total? | - | minimum 1 |

##### `ActivityUpdateData` — `product-feedback-given`

| Name | Type | Description | Accepted if | Restrictions |
| --- | --- | --- | --- | --- |
| `title` (optional) | string | Title | - | max length 200; min length 3 |
| `description` (optional) | string | Description | - | max length 2000 |
| `contentType` (optional) | string | Content type | - | enum: `Early access program`, `Product feedback session` |
| `productDescription` (optional) | string | What product was it about? | - | max length 500 |
| `tags` (optional) | array | Tags | - | enum [318 values], see [Shared tag enums](#shared-tag-enums); min items 0 |
| `metrics` (optional) | Metrics | - | - | - |
| `activityDate` (optional) | string | Participation Date | - | pattern ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ |
| `additionalInfo` (optional) | string | Additional information | - | max length 2000 |
| `private` (optional) | boolean | Do you want to make this activity private? | - | - |

##### `Metrics` — `product-feedback-given`

| Name | Type | Description | Accepted if | Restrictions |
| --- | --- | --- | --- | --- |
| `timeSpent` (optional) | integer | Time spent (in minutes) | - | minimum 1 |

##### `ActivityUpdateData` — `public-speaking`

| Name | Type | Description | Accepted if | Restrictions |
| --- | --- | --- | --- | --- |
| `title` (optional) | string | What was the title of your talk? | - | max length 200; min length 3 |
| `description` (optional) | string | What was it about? | - | max length 2000 |
| `tags` (optional) | array | Tags | - | enum [318 values], see [Shared tag enums](#shared-tag-enums); min items 0 |
| `metrics` (optional) | Metrics | - | - | - |
| `eventFormat` (optional) | string | Select event format | - | enum: `In-Person`, `Virtual`, `Hybrid` |
| `country` (optional) | string | Country | `eventFormat` is `In-Person` or `Hybrid` | max length 100; min length 1 |
| `inPersonAttendees` (optional) | integer | Out of all, how many people attended your session in-person? | `eventFormat` is `Hybrid` | minimum 0 |
| `activityDate` (optional) | string | Date of your talk | - | pattern ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ |
| `activityUrl` (optional) | string | Share the event link (if it's a GDG event, the gdg.community.dev event URL) or any other relevant link | - | max length 500; pattern ^https?:\/\/(www\.)?.*$ |
| `additionalInfo` (optional) | string | Additional information | - | max length 2000 |
| `private` (optional) | boolean | Do you want to make this activity private? | - | - |

##### `Metrics` — `public-speaking`

| Name | Type | Description | Accepted if | Restrictions |
| --- | --- | --- | --- | --- |
| `attendees` (optional) | integer | How many people attended your session in total? | - | minimum 1 |

##### `ActivityUpdateData` — `stories`

| Name | Type | Description | Accepted if | Restrictions |
| --- | --- | --- | --- | --- |
| `title` (optional) | string | Title of the story | - | max length 200; min length 3 |
| `description` (optional) | string | Description | - | max length 2000 |
| `whyIsSignificant` (optional) | string | Tell us more about it and why it is significant | - | max length 2000 |
| `significanceType` (optional) | string | Significance type | - | enum: `Diversity & Inclusion`, `Helping Business`, `Social Impact`, `Feedback to Google`, `Community Leading`, `Technology / Open source` |
| `activityUrl` (optional) | string | Link | - | max length 500; pattern ^https?:\/\/(www\.)?.*$ |
| `tags` (optional) | array | Tags | - | enum [318 values], see [Shared tag enums](#shared-tag-enums); min items 0 |
| `metrics` (optional) | Metrics | - | - | - |
| `additionalInfo` (optional) | string | Additional information | - | max length 2000 |
| `private` (optional) | boolean | Do you want to make this activity private? | - | - |

##### `Metrics` — `stories`

| Name | Type | Description | Accepted if | Restrictions |
| --- | --- | --- | --- | --- |
| `impact` (optional) | integer | What was your impact in views, reads, attendees, etc.? Add a number below: | - | minimum 1 |

##### `ActivityUpdateData` — `workshop`

| Name | Type | Description | Accepted if | Restrictions |
| --- | --- | --- | --- | --- |
| `title` (optional) | string | What was the name of your workshop session? | - | max length 200; min length 3 |
| `description` (optional) | string | What was it about? | - | max length 2000 |
| `tags` (optional) | array | Tags | - | enum [318 values], see [Shared tag enums](#shared-tag-enums); min items 0 |
| `metrics` (optional) | Metrics | - | - | - |
| `eventFormat` (optional) | string | Select event format | - | enum: `In-Person`, `Virtual`, `Hybrid` |
| `country` (optional) | string | Country | `eventFormat` is `In-Person` or `Hybrid` | max length 100; min length 1 |
| `inPersonAttendees` (optional) | integer | Out of all, how many people attended your session in-person? | `eventFormat` is `Hybrid` | minimum 0 |
| `activityDate` (optional) | string | Date of your workshop | - | pattern ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ |
| `activityUrl` (optional) | string | Share the event link (if it's a GDG event, the gdg.community.dev event URL) or any other relevant link | - | max length 500; pattern ^https?:\/\/(www\.)?.*$ |
| `additionalInfo` (optional) | string | Additional information | - | max length 2000 |
| `private` (optional) | boolean | Do you want to make this activity private? | - | - |

##### `Metrics` — `workshop`

| Name | Type | Description | Accepted if | Restrictions |
| --- | --- | --- | --- | --- |
| `attendees` (optional) | integer | How many people have been trained? | - | minimum 1 |

#### Response

| Name | Type | Description |
| --- | --- | --- |
| `type` | string | - |
| `data` | ActivityData | - |
| `submissionDate` | string | e.g. 2026-01-01T00:00:00Z |
| `updatedDate` | string | e.g. 2026-01-01T00:00:00Z |
| `archiveDate` (optional) | string | e.g. 2026-01-01T00:00:00Z |
| `activityId` | string | - |

#### Response models

##### `ActivityData` — `content-creation`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `contentType` | string | Content type | - | enum: `Articles`, `Books`, `Code contribution`, `Demos`, `Newsletters`, `Podcasts`, `Videos` |
| `title` | string | What was the title? | - | max length 200; min length 3 |
| `description` | string | What was it about? | - | max length 20000 |
| `description_plain_text` | string | - | - | max length 2000 |
| `tags` (optional) | array | Tags | - | enum [318 values], see [Shared tag enums](#shared-tag-enums); min items 0 |
| `metrics` | Metrics | - | - | - |
| `activityDate` | string | Date published | - | pattern ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ |
| `activityUrl` | string | Link to Content | - | max length 500; pattern ^https?:\/\/(www\.)?.*$ |
| `imageUrl` (optional) | string | Please provide an image for your activity | - | max length 500 |
| `additionalInfo` (optional) | string | Additional information | - | max length 20000 |
| `additionalInfo_plain_text` (optional) | string | - | - | max length 2000 |
| `private` | boolean | Do you want to make this activity private? | - | - |

##### `Metrics` — `content-creation`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `readers` | integer | How many people read your content? | - | minimum 1 |

##### `ActivityData` — `interaction-with-googlers`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `title` | string | Title | - | max length 200; min length 3 |
| `description` | string | Description | - | max length 20000 |
| `description_plain_text` | string | - | - | max length 2000 |
| `format` | string | Format | - | enum: `Survey`, `Video feedback`, `In-person feedback sessions`, `Online feedback sessions`, `Feedback summits`, `User study / focus group`, `Feedback submissions`, `Other` |
| `interactionType` | string | Interaction Type | - | enum: `Product feedback (research studies, roadmap input, Customer Advisory Boards, EAP)`, `File bugs / help out with finding bugs`, `GitHub`, `Stack Overflow`, `Industry`, `Other interactions with Google Product Teams` |
| `tags` (optional) | array | Tags | - | enum [318 values], see [Shared tag enums](#shared-tag-enums); min items 0 |
| `metrics` | Metrics | - | - | - |
| `activityDate` | string | Interaction Date | - | pattern ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ |
| `imageUrl` (optional) | string | Please provide an image for your activity | - | max length 500 |
| `additionalInfo` (optional) | string | Additional information | - | max length 20000 |
| `additionalInfo_plain_text` (optional) | string | - | - | max length 2000 |
| `additionalLinks` (optional) | string | Additional links | - | max length 20000 |
| `additionalLinks_plain_text` (optional) | string | - | - | max length 2000 |
| `private` | boolean | Do you want to make this activity private? | - | - |

##### `Metrics` — `interaction-with-googlers`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `timeSpent` | integer | Time spent (in minutes) | - | minimum 1 |

##### `ActivityData` — `mentoring`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `title` | string | What was the name of your mentoring session? | - | max length 200; min length 3 |
| `description` | string | What was it about? | - | max length 20000 |
| `description_plain_text` | string | - | - | max length 2000 |
| `tags` (optional) | array | Tags | - | enum [318 values], see [Shared tag enums](#shared-tag-enums); min items 0 |
| `metrics` | Metrics | - | - | - |
| `eventFormat` | string | Select event format | - | enum: `In-Person`, `Virtual`, `Hybrid` |
| `country` (conditional) | string | Country | `eventFormat` is `In-Person` or `Hybrid` | max length 100; min length 1 |
| `countryIso` (optional) | string | - | - | max length 2; min length 2 |
| `city` (conditional) | string | City | `eventFormat` is `In-Person` or `Hybrid` | max length 100; min length 1 |
| `cityPlaceId` (optional) | string | - | - | max length 500; min length 1 |
| `cityState` (optional) | string | - | - | max length 100; min length 1 |
| `inPersonAttendees` (conditional) | integer | Out of all, how many people attended your session in-person? | `eventFormat` is `Hybrid` | minimum 0 |
| `activityDate` | string | Date of your mentoring session | - | pattern ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ |
| `activityUrl` (optional) | string | Share the event link (e.g. Accelerator or Solution Challenge website, gdg.community.dev event URL, program website,etc) or any other relevant link | - | max length 500; pattern ^https?:\/\/(www\.)?.*$ |
| `imageUrl` (optional) | string | Please provide an image for your activity | - | max length 500 |
| `additionalInfo` (optional) | string | Additional information | - | max length 20000 |
| `additionalInfo_plain_text` (optional) | string | - | - | max length 2000 |
| `private` | boolean | Do you want to make this activity private? | - | - |

##### `Metrics` — `mentoring`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `attendees` | integer | How many people have been mentored in total? | - | minimum 1 |

##### `ActivityData` — `product-feedback-given`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `title` | string | Title | - | max length 200; min length 3 |
| `description` | string | Description | - | max length 20000 |
| `description_plain_text` | string | - | - | max length 2000 |
| `contentType` | string | Content type | - | enum: `Early access program`, `Product feedback session` |
| `productDescription` | string | What product was it about? | - | max length 5000 |
| `productDescription_plain_text` | string | - | - | max length 500 |
| `tags` (optional) | array | Tags | - | enum [318 values], see [Shared tag enums](#shared-tag-enums); min items 0 |
| `metrics` | Metrics | - | - | - |
| `activityDate` | string | Participation Date | - | pattern ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ |
| `imageUrl` (optional) | string | Please provide an image for your activity | - | max length 500 |
| `additionalInfo` (optional) | string | Additional information | - | max length 20000 |
| `additionalInfo_plain_text` (optional) | string | - | - | max length 2000 |
| `private` | boolean | Do you want to make this activity private? | - | - |

##### `Metrics` — `product-feedback-given`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `timeSpent` | integer | Time spent (in minutes) | - | minimum 1 |

##### `ActivityData` — `public-speaking`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `title` | string | What was the title of your talk? | - | max length 200; min length 3 |
| `description` | string | What was it about? | - | max length 20000 |
| `description_plain_text` | string | - | - | max length 2000 |
| `tags` (optional) | array | Tags | - | enum [318 values], see [Shared tag enums](#shared-tag-enums); min items 0 |
| `metrics` | Metrics | - | - | - |
| `eventFormat` | string | Select event format | - | enum: `In-Person`, `Virtual`, `Hybrid` |
| `country` (conditional) | string | Country | `eventFormat` is `In-Person` or `Hybrid` | max length 100; min length 1 |
| `countryIso` (optional) | string | - | - | max length 2; min length 2 |
| `city` (conditional) | string | City | `eventFormat` is `In-Person` or `Hybrid` | max length 100; min length 1 |
| `cityPlaceId` (optional) | string | - | - | max length 500; min length 1 |
| `cityState` (optional) | string | - | - | max length 100; min length 1 |
| `inPersonAttendees` (conditional) | integer | Out of all, how many people attended your session in-person? | `eventFormat` is `Hybrid` | minimum 0 |
| `activityDate` | string | Date of your talk | - | pattern ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ |
| `activityUrl` | string | Share the event link (if it's a GDG event, the gdg.community.dev event URL) or any other relevant link | - | max length 500; pattern ^https?:\/\/(www\.)?.*$ |
| `additionalInfo` (optional) | string | Additional information | - | max length 20000 |
| `additionalInfo_plain_text` (optional) | string | - | - | max length 2000 |
| `imageUrl` (optional) | string | Please provide an image for your activity | - | max length 500 |
| `private` | boolean | Do you want to make this activity private? | - | - |

##### `Metrics` — `public-speaking`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `attendees` | integer | How many people attended your session in total? | - | minimum 1 |

##### `ActivityData` — `stories`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `title` | string | Title of the story | - | max length 200; min length 3 |
| `description` | string | Description | - | max length 20000 |
| `description_plain_text` | string | - | - | max length 2000 |
| `whyIsSignificant` | string | Tell us more about it and why it is significant | - | max length 20000 |
| `whyIsSignificant_plain_text` | string | - | - | max length 2000 |
| `significanceType` | string | Significance type | - | enum: `Diversity & Inclusion`, `Helping Business`, `Social Impact`, `Feedback to Google`, `Community Leading`, `Technology / Open source` |
| `activityUrl` | string | Link | - | max length 500; pattern ^https?:\/\/(www\.)?.*$ |
| `tags` (optional) | array | Tags | - | enum [318 values], see [Shared tag enums](#shared-tag-enums); min items 0 |
| `metrics` | Metrics | - | - | - |
| `imageUrl` (optional) | string | Please provide an image for your activity | - | max length 500 |
| `additionalInfo` (optional) | string | Additional information | - | max length 20000 |
| `additionalInfo_plain_text` (optional) | string | - | - | max length 2000 |
| `private` | boolean | Do you want to make this activity private? | - | - |

##### `Metrics` — `stories`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `impact` | integer | What was your impact in views, reads, attendees, etc.? Add a number below: | - | minimum 1 |

##### `ActivityData` — `workshop`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `title` | string | What was the name of your workshop session? | - | max length 200; min length 3 |
| `description` | string | What was it about? | - | max length 20000 |
| `description_plain_text` | string | - | - | max length 2000 |
| `tags` (optional) | array | Tags | - | enum [318 values], see [Shared tag enums](#shared-tag-enums); min items 0 |
| `metrics` | Metrics | - | - | - |
| `eventFormat` | string | Select event format | - | enum: `In-Person`, `Virtual`, `Hybrid` |
| `country` (conditional) | string | Country | `eventFormat` is `In-Person` or `Hybrid` | max length 100; min length 1 |
| `countryIso` (optional) | string | - | - | max length 2; min length 2 |
| `city` (conditional) | string | City | `eventFormat` is `In-Person` or `Hybrid` | max length 100; min length 1 |
| `cityPlaceId` (optional) | string | - | - | max length 500; min length 1 |
| `cityState` (optional) | string | - | - | max length 100; min length 1 |
| `inPersonAttendees` (conditional) | integer | Out of all, how many people attended your session in-person? | `eventFormat` is `Hybrid` | minimum 0 |
| `activityDate` | string | Date of your workshop | - | pattern ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ |
| `activityUrl` (optional) | string | Share the event link (if it's a GDG event, the gdg.community.dev event URL) or any other relevant link | - | max length 500; pattern ^https?:\/\/(www\.)?.*$ |
| `imageUrl` (optional) | string | Please provide an image for your activity | - | max length 500 |
| `additionalInfo` (optional) | string | Additional information | - | max length 20000 |
| `additionalInfo_plain_text` (optional) | string | - | - | max length 2000 |
| `private` | boolean | Do you want to make this activity private? | - | - |

##### `Metrics` — `workshop`

| Name | Type | Description | Required if | Restrictions |
| --- | --- | --- | --- | --- |
| `attendees` | integer | How many people have been trained? | - | minimum 1 |

## Activity drafts

Create an activity draft. Every field on these write routes is marked optional in the saved page.
Write limits are tighter than read models: description max 2000 on draft/update, 20000 on read. Draft bodies are the fields themselves. They are not wrapped in `{ "data": ... }`.

### `POST /activity-drafts/content-creation`

Allows creating an activity draft.

#### Request body

| Name | Type | Description | Accepted if | Restrictions |
| --- | --- | --- | --- | --- |
| `contentType` (optional) | string | Content type | - | enum: `Articles`, `Books`, `Code contribution`, `Demos`, `Newsletters`, `Podcasts`, `Videos` |
| `title` (optional) | string | What was the title? | - | max length 200; min length 3 |
| `description` (optional) | string | What was it about? | - | max length 2000 |
| `tags` (optional) | array | Tags | - | enum [81 values], see [Shared tag enums](#shared-tag-enums); min items 0 |
| `metrics` (optional) | Metrics | - | - | - |
| `activityDate` (optional) | string | Date published | - | pattern ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ |
| `activityUrl` (optional) | string | Link to Content | - | max length 500; pattern ^https?:\/\/(www\.)?.*$ |
| `additionalInfo` (optional) | string | Additional information | - | max length 2000 |
| `private` (optional) | boolean | Do you want to make this activity private? | - | - |

#### Request models

##### `Metrics` — `content-creation`

| Name | Type | Description | Accepted if | Restrictions |
| --- | --- | --- | --- | --- |
| `readers` (optional) | integer | How many people read your content? | - | minimum 1 |

#### Response

| Name | Type | Description |
| --- | --- | --- |
| `id` | string | id of created activity draft |

### `POST /activity-drafts/interaction-with-googlers`

Allows creating an activity draft.

#### Request body

| Name | Type | Description | Accepted if | Restrictions |
| --- | --- | --- | --- | --- |
| `title` (optional) | string | Title | - | max length 200; min length 3 |
| `description` (optional) | string | Description | - | max length 2000 |
| `format` (optional) | string | Format | - | enum: `Survey`, `Video feedback`, `In-person feedback sessions`, `Online feedback sessions`, `Feedback summits`, `User study / focus group`, `Feedback submissions`, `Other` |
| `interactionType` (optional) | string | Interaction Type | - | enum: `Product feedback (research studies, roadmap input, Customer Advisory Boards, EAP)`, `File bugs / help out with finding bugs`, `GitHub`, `Stack Overflow`, `Industry`, `Other interactions with Google Product Teams` |
| `tags` (optional) | array | Tags | - | enum [81 values], see [Shared tag enums](#shared-tag-enums); min items 0 |
| `metrics` (optional) | Metrics | - | - | - |
| `activityDate` (optional) | string | Interaction Date | - | pattern ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ |
| `additionalInfo` (optional) | string | Additional information | - | max length 2000 |
| `additionalLinks` (optional) | string | Additional links | - | max length 2000 |
| `private` (optional) | boolean | Do you want to make this activity private? | - | - |

#### Request models

##### `Metrics` — `interaction-with-googlers`

| Name | Type | Description | Accepted if | Restrictions |
| --- | --- | --- | --- | --- |
| `timeSpent` (optional) | integer | Time spent (in minutes) | - | minimum 1 |

#### Response

| Name | Type | Description |
| --- | --- | --- |
| `id` | string | id of created activity draft |

### `POST /activity-drafts/mentoring`

Allows creating an activity draft.

#### Request body

| Name | Type | Description | Accepted if | Restrictions |
| --- | --- | --- | --- | --- |
| `title` (optional) | string | What was the name of your mentoring session? | - | max length 200; min length 3 |
| `description` (optional) | string | What was it about? | - | max length 2000 |
| `tags` (optional) | array | Tags | - | enum [81 values], see [Shared tag enums](#shared-tag-enums); min items 0 |
| `metrics` (optional) | Metrics | - | - | - |
| `eventFormat` (optional) | string | Select event format | - | enum: `In-Person`, `Virtual`, `Hybrid` |
| `country` (optional) | string | Country | `eventFormat` is `In-Person` or `Hybrid` | max length 100; min length 1 |
| `inPersonAttendees` (optional) | integer | Out of all, how many people attended your session in-person? | `eventFormat` is `Hybrid` | minimum 0 |
| `activityDate` (optional) | string | Date of your mentoring session | - | pattern ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ |
| `activityUrl` (optional) | string | Share the event link (e.g. Accelerator or Solution Challenge website, gdg.community.dev event URL, program website,etc) or any other relevant link | - | max length 500; pattern ^https?:\/\/(www\.)?.*$ |
| `additionalInfo` (optional) | string | Additional information | - | max length 2000 |
| `private` (optional) | boolean | Do you want to make this activity private? | - | - |

#### Request models

##### `Metrics` — `mentoring`

| Name | Type | Description | Accepted if | Restrictions |
| --- | --- | --- | --- | --- |
| `attendees` (optional) | integer | How many people have been mentored in total? | - | minimum 1 |

#### Response

| Name | Type | Description |
| --- | --- | --- |
| `id` | string | id of created activity draft |

### `POST /activity-drafts/product-feedback-given`

Allows creating an activity draft.

#### Request body

| Name | Type | Description | Accepted if | Restrictions |
| --- | --- | --- | --- | --- |
| `title` (optional) | string | Title | - | max length 200; min length 3 |
| `description` (optional) | string | Description | - | max length 2000 |
| `contentType` (optional) | string | Content type | - | enum: `Early access program`, `Product feedback session` |
| `productDescription` (optional) | string | What product was it about? | - | max length 500 |
| `tags` (optional) | array | Tags | - | enum [81 values], see [Shared tag enums](#shared-tag-enums); min items 0 |
| `metrics` (optional) | Metrics | - | - | - |
| `activityDate` (optional) | string | Participation Date | - | pattern ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ |
| `additionalInfo` (optional) | string | Additional information | - | max length 2000 |
| `private` (optional) | boolean | Do you want to make this activity private? | - | - |

#### Request models

##### `Metrics` — `product-feedback-given`

| Name | Type | Description | Accepted if | Restrictions |
| --- | --- | --- | --- | --- |
| `timeSpent` (optional) | integer | Time spent (in minutes) | - | minimum 1 |

#### Response

| Name | Type | Description |
| --- | --- | --- |
| `id` | string | id of created activity draft |

### `POST /activity-drafts/public-speaking`

Allows creating an activity draft.

#### Request body

| Name | Type | Description | Accepted if | Restrictions |
| --- | --- | --- | --- | --- |
| `title` (optional) | string | What was the title of your talk? | - | max length 200; min length 3 |
| `description` (optional) | string | What was it about? | - | max length 2000 |
| `tags` (optional) | array | Tags | - | enum [81 values], see [Shared tag enums](#shared-tag-enums); min items 0 |
| `metrics` (optional) | Metrics | - | - | - |
| `eventFormat` (optional) | string | Select event format | - | enum: `In-Person`, `Virtual`, `Hybrid` |
| `country` (optional) | string | Country | `eventFormat` is `In-Person` or `Hybrid` | max length 100; min length 1 |
| `inPersonAttendees` (optional) | integer | Out of all, how many people attended your session in-person? | `eventFormat` is `Hybrid` | minimum 0 |
| `activityDate` (optional) | string | Date of your talk | - | pattern ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ |
| `activityUrl` (optional) | string | Share the event link (if it's a GDG event, the gdg.community.dev event URL) or any other relevant link | - | max length 500; pattern ^https?:\/\/(www\.)?.*$ |
| `additionalInfo` (optional) | string | Additional information | - | max length 2000 |
| `private` (optional) | boolean | Do you want to make this activity private? | - | - |

#### Request models

##### `Metrics` — `public-speaking`

| Name | Type | Description | Accepted if | Restrictions |
| --- | --- | --- | --- | --- |
| `attendees` (optional) | integer | How many people attended your session in total? | - | minimum 1 |

#### Response

| Name | Type | Description |
| --- | --- | --- |
| `id` | string | id of created activity draft |

### `POST /activity-drafts/stories`

Allows creating an activity draft.

#### Request body

| Name | Type | Description | Accepted if | Restrictions |
| --- | --- | --- | --- | --- |
| `title` (optional) | string | Title of the story | - | max length 200; min length 3 |
| `description` (optional) | string | Description | - | max length 2000 |
| `whyIsSignificant` (optional) | string | Tell us more about it and why it is significant | - | max length 2000 |
| `significanceType` (optional) | string | Significance type | - | enum: `Diversity & Inclusion`, `Helping Business`, `Social Impact`, `Feedback to Google`, `Community Leading`, `Technology / Open source` |
| `activityUrl` (optional) | string | Link | - | max length 500; pattern ^https?:\/\/(www\.)?.*$ |
| `tags` (optional) | array | Tags | - | enum [81 values], see [Shared tag enums](#shared-tag-enums); min items 0 |
| `metrics` (optional) | Metrics | - | - | - |
| `additionalInfo` (optional) | string | Additional information | - | max length 2000 |
| `private` (optional) | boolean | Do you want to make this activity private? | - | - |

#### Request models

##### `Metrics` — `stories`

| Name | Type | Description | Accepted if | Restrictions |
| --- | --- | --- | --- | --- |
| `impact` (optional) | integer | What was your impact in views, reads, attendees, etc.? Add a number below: | - | minimum 1 |

#### Response

| Name | Type | Description |
| --- | --- | --- |
| `id` | string | id of created activity draft |

### `POST /activity-drafts/workshop`

Allows creating an activity draft.

#### Request body

| Name | Type | Description | Accepted if | Restrictions |
| --- | --- | --- | --- | --- |
| `title` (optional) | string | What was the name of your workshop session? | - | max length 200; min length 3 |
| `description` (optional) | string | What was it about? | - | max length 2000 |
| `tags` (optional) | array | Tags | - | enum [81 values], see [Shared tag enums](#shared-tag-enums); min items 0 |
| `metrics` (optional) | Metrics | - | - | - |
| `eventFormat` (optional) | string | Select event format | - | enum: `In-Person`, `Virtual`, `Hybrid` |
| `country` (optional) | string | Country | `eventFormat` is `In-Person` or `Hybrid` | max length 100; min length 1 |
| `inPersonAttendees` (optional) | integer | Out of all, how many people attended your session in-person? | `eventFormat` is `Hybrid` | minimum 0 |
| `activityDate` (optional) | string | Date of your workshop | - | pattern ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ |
| `activityUrl` (optional) | string | Share the event link (if it's a GDG event, the gdg.community.dev event URL) or any other relevant link | - | max length 500; pattern ^https?:\/\/(www\.)?.*$ |
| `additionalInfo` (optional) | string | Additional information | - | max length 2000 |
| `private` (optional) | boolean | Do you want to make this activity private? | - | - |

#### Request models

##### `Metrics` — `workshop`

| Name | Type | Description | Accepted if | Restrictions |
| --- | --- | --- | --- | --- |
| `attendees` (optional) | integer | How many people have been trained? | - | minimum 1 |

#### Response

| Name | Type | Description |
| --- | --- | --- |
| `id` | string | id of created activity draft |

## Example draft bodies

Minimal shapes an MCP can send. All fields are optional in the docs. These use the fields a person would actually fill in.

### `POST /activity-drafts/content-creation`

```json
{
  "contentType": "Articles",
  "title": "Shipping an agent on Cloudflare Workers",
  "description": "What the piece covers.",
  "activityDate": "2026-09-01",
  "activityUrl": "https://example.com/post",
  "tags": ["AI", "Web"],
  "metrics": { "readers": 120 },
  "private": false
}
```

`contentType`: `Articles`, `Books`, `Code contribution`, `Demos`, `Newsletters`, `Podcasts`, `Videos`.

### `POST /activity-drafts/public-speaking`

```json
{
  "title": "Agents on the edge",
  "description": "What the talk covered.",
  "eventFormat": "Hybrid",
  "country": "India",
  "inPersonAttendees": 40,
  "activityDate": "2026-09-01",
  "activityUrl": "https://gdg.community.dev/events/example",
  "metrics": { "attendees": 80 },
  "private": false
}
```

`country` is accepted only when `eventFormat` is `In-Person` or `Hybrid`. `inPersonAttendees` is accepted only when `eventFormat` is `Hybrid`.

### `POST /activity-drafts/workshop`

Same shape as public speaking, plus `metrics.attendees` = how many people were trained. `activityUrl` is optional.

### `POST /activity-drafts/mentoring`

Same event fields as public speaking. `metrics.attendees` = how many people were mentored. `activityUrl` is optional.

### `POST /activity-drafts/stories`

```json
{
  "title": "Story title",
  "description": "What happened.",
  "whyIsSignificant": "Why it matters.",
  "significanceType": "Social Impact",
  "activityUrl": "https://example.com/story",
  "metrics": { "impact": 500 },
  "private": false
}
```

`significanceType`: `Diversity & Inclusion`, `Helping Business`, `Social Impact`, `Feedback to Google`, `Community Leading`, `Technology / Open source`.

### `POST /activity-drafts/interaction-with-googlers`

```json
{
  "title": "Product feedback session",
  "description": "What was discussed.",
  "format": "Online feedback sessions",
  "interactionType": "Product feedback (research studies, roadmap input, Customer Advisory Boards, EAP)",
  "activityDate": "2026-09-01",
  "metrics": { "timeSpent": 45 },
  "private": false
}
```

### `POST /activity-drafts/product-feedback-given`

```json
{
  "title": "Early access notes",
  "description": "What feedback was given.",
  "contentType": "Early access program",
  "productDescription": "Gemini",
  "activityDate": "2026-09-01",
  "metrics": { "timeSpent": 30 },
  "private": false
}
```

`contentType`: `Early access program`, `Product feedback session`.

### `PATCH /activities/{activityId}`

Body is wrapped. Fields inside `data` are the update variants (all optional).

```json
{
  "data": {
    "title": "Updated title",
    "private": true
  }
}
```

The saved page does not say how the server picks the `ActivityUpdateData` variant. It is probably implied by the existing activity type. Do not send a `type` field. It is not in the update body.

## Shared tag enums

Tag fields repeat. Draft and update routes use the shorter set (81). Read models use the longer set (318). The short set is not a documented subset name. It is just the enum attached to write routes in the saved page.

### Tag set 1 — Read models (318 values)

Seen on: ActivityData `content-creation`, ActivityData `interaction-with-googlers`, ActivityData `mentoring`, ActivityData `product-feedback-given`, ActivityData `public-speaking`, ActivityData `stories`, ActivityData `workshop`, ActivityUpdateData `content-creation`….

- AI
- AI - AI Studio
- AI - Agent Development Kit (ADK)
- AI - Agents
- AI - Antigravity
- AI - Colab
- AI - Gemini
- AI - Gemini CLI
- AI - Gemini Enterprise Agent Platform
- AI - Gemma
- AI - Generative AI
- AI - Genkit
- AI - JAX
- AI - Kaggle
- AI - Keras
- AI - LLM
- AI - LiteRT
- AI - ML Engineering (MLOps)
- AI - MediaPipe
- AI - On-Device AI
- AI - Responsible AI
- AI - TPU
- AI - TensorFlow
- AI - TensorFlow Extended
- AI - Tensorflow.js
- AI - TorchTPU
- AI - Veo
- AI - vLLM
- AI Math Clubs
- AI Paper Reading Clubs
- AIY Kits
- AMP
- AMP Frontend
- AMP Performance
- AR/VR
- Accessibility on Android
- Actions on Google
- Android
- Android - ARCore
- Android - Adaptive
- Android - Android Auto
- Android - Android Dev Tools
- Android - Android Studio
- Android - Android TV
- Android - App Architecture & Arch Components
- Android - App Indexing
- Android - App Performance
- Android - App Quality
- Android - Camera
- Android - Composer
- Android - Developer Productivity
- Android - Differentiated
- Android - Form Factors
- Android - Gemini Nano
- Android - Intelligent
- Android - Jetpack
- Android - Jetpack Compose
- Android - Kotlin
- Android - Material Design
- Android - Media
- Android - Modern Android Development
- Android - Modern UI
- Android - NDK
- Android - Passkeys
- Android - Performance
- Android - Vulkan
- Android - Wear OS
- Android - Widgets
- Android - XR
- Android Things
- Angular
- Apache Beam
- App Engine (GAE)
- App Security
- Assistant
- BigQuery
- Bigtable
- Billing APIs
- Branding
- Browser Extension
- Build with AI
- CSS
- Chat Apps
- Chrome
- Client Libraries
- Cloud - AI Tools
- Cloud - API Gateways
- Cloud - App Development
- Cloud - Compute, Networking, Storage
- Cloud - Data
- Cloud - Operations & Management
- Cloud - Security
- Cloud - Serverless & Containers
- Cloud AutoML
- Cloud Build
- Cloud Conversational AI
- Cloud Endpoints
- Cloud Firestore
- Cloud Functions (GCF)
- Cloud IoT Core
- Cloud ML Engine
- Cloud ML Engineering
- Cloud NLP, Translation, and Documents
- Cloud Run
- Cloud SQL
- Cloud Scheduler Services
- Cloud Spanner
- Cloud Storage
- Cloud Study Jam
- Cloud TPU
- Cloud Tabular Data
- Cloud Vision & Video
- CloudShell
- Community Leading
- Composer
- Compute Engine (GCE)
- Containers
- Conversational Design Workshop
- Convosprint
- Core Web Vitals
- Crashlytics
- Dart - Flutter
- Data Analysis
- Dataflow
- Datalab
- Dataprep
- Dataproc
- Datastore
- Daydream
- Deep Learning
- Dev Library
- Dev Ops
- DevFest
- Dialogflow
- Dialogflow Enterprise Edition
- Distribution
- Diversity & Inclusion
- Docker
- Duet AI
- EE Python API
- Earth Engine
- Firebase
- Firebase - A/B Testing
- Firebase - AI Logic
- Firebase - AI Monitoring
- Firebase - Analytics
- Firebase - App Check
- Firebase - App Distribution
- Firebase - App Hosting
- Firebase - Authentication
- Firebase - Cloud Messaging
- Firebase - Crashlytics
- Firebase - Firebase Studio
- Firebase - Firestore
- Firebase - Functions
- Firebase - Performance
- Firebase - Realtime Database
- Firebase - Remote Config
- Firebase - SQL Connect
- Firebase - Test Lab
- Firebase Performance
- Firebase Real Time DB
- Forseti
- Framework
- GCP credit supported
- GPU
- Geemap
- Generic Android
- Genomics
- Go
- Golang
- Google API
- Google APIs for iOS
- Google Analytics
- Google App Maker
- Google Cloud
- Google Cloud Skills Boost credit supported
- Google Design Sprints
- Google DevRel
- Google Drive
- Google I/O Extended
- Google Maps Platform
- Google Play
- Google Workspace
- Google Workspace APIs
- Google Workspace EDU
- Google Workspace Product
- HTML5
- Hangouts Chat
- Identity
- Identity - Google OAuth
- Identity - Sign in with Google
- Identity and Access Management
- Interaction Design
- International Women's Day
- Internet of Things
- IoT Core
- Istio
- JAX/Flax
- Java
- Javascript
- Jump Start Solutions
- Kaggle
- Kaggle Models
- Kubernetes
- Kubernetes Engine (GKE)
- ML APIs
- ML Campaign - ML Olympiad
- ML Focus Area - Applied ML
- ML Focus Area - ML Engineering(MLOps)
- ML Focus Area - ML Research
- ML Focus Area - On-Device ML
- ML Focus Area - Responsible ML/AI
- ML Kit
- ML Products - Bard
- ML Products - BigQuery ML
- ML Products - Cloud AI
- ML Products - JAX/Flax
- ML Products - Kaggle
- ML Products - Keras
- ML Products - MakerSuite
- ML Products - MediaPipe
- ML Products - PaLM API
- ML Products - TFLite
- ML Products - TFX
- ML Products - TPU
- ML Products - TensorFlow Core
- ML Products - TensorFlow Recommendations
- ML Products - TensorFlow.js
- ML Products - Tensorflow Lite
- ML Products - Vertex AI
- ML Study Jams
- Machine Learning
- Marketing
- Material 3
- Meet Apps
- Memorystore
- Mentoring
- Modern Architecture
- Monetization
- Native Development Kit
- On-Device ML
- Open Source
- OpenCensus
- PWA
- Payments
- Payments - Google Pay
- Payments - Google Wallet
- Play Instant Apps
- Polymer
- Prediction
- Product Strategy
- Progressive Web Apps and Project Fugu
- Pub/Sub
- Python
- RAG
- Resource Manager
- Road to Google Developers Certification
- RxJS
- SRE
- Security & Networking
- Security, Privacy, Payments, and Identity
- Sensors
- Serverless App Development
- Social Impact
- Speaking
- Speech to Text API
- Spinnaker
- Sprint Master
- Stackdriver
- Startup Mentoring
- Startup Talks
- Startup Training
- Storage
- TFX
- TensorFlow Core
- Text to Speech API
- Training
- Translate API
- Tuning
- UI Toolkit
- UI and Tooling
- UX / UI Design
- UX App Review
- User Research
- V8
- Video Intelligence API
- Vision API
- Visual Design
- Wearables
- Web
- Web - AI for Web Developers
- Web - Browser Extensions
- Web - CSS & UI
- Web - DevTools & Browser Automation
- Web - Fugu/PWA APIs
- Web - Identity
- Web - Performance
- Web Assembly
- Web Capabilities
- Web Components
- Web Installability
- Web Media Technologies
- Web Navigation
- Web Offline
- Web Privacy
- Web RTC
- Web Security
- Web Technologies
- Web UX
- WebAssembly
- Workspace - Add Ons
- Workspace - AppSheet
- Workspace - Google Apps Script
- Workspace - Google Workspace (REST) APIs
- dotNet
- gRPC
- gVisor

### Tag set 2 — Draft and update routes (81 values)

Seen on: Request body.

- AI
- AI - AI Studio
- AI - Agent Development Kit (ADK)
- AI - Antigravity
- AI - Colab
- AI - Gemini
- AI - Gemini Enterprise Agent Platform
- AI - Gemma
- AI - Genkit
- AI - JAX
- AI - Kaggle
- AI - Keras
- AI - LiteRT
- AI - MediaPipe
- AI - TPU
- AI - TorchTPU
- AI - vLLM
- AR/VR
- Android
- Android - Adaptive
- Android - Developer Productivity
- Android - Differentiated
- Android - Intelligent
- Angular
- Build with AI
- Cloud - AI Tools
- Cloud - API Gateways
- Cloud - App Development
- Cloud - Compute, Networking, Storage
- Cloud - Data
- Cloud - Operations & Management
- Cloud - Security
- Cloud - Serverless & Containers
- Cloud Study Jam
- Dart - Flutter
- DevFest
- Diversity & Inclusion
- Earth Engine
- Firebase
- Firebase - AI Logic
- Firebase - AI Monitoring
- Firebase - App Check
- Firebase - App Distribution
- Firebase - App Hosting
- Firebase - Authentication
- Firebase - Cloud Messaging
- Firebase - Crashlytics
- Firebase - Firestore
- Firebase - Functions
- Firebase - Performance
- Firebase - Realtime Database
- Firebase - Remote Config
- Firebase - SQL Connect
- Golang
- Google Cloud
- Google I/O Extended
- Google Maps Platform
- Google Workspace
- Identity
- Identity - Google OAuth
- Identity - Sign in with Google
- International Women's Day
- ML Study Jams
- Open Source
- Payments
- Payments - Google Pay
- Payments - Google Wallet
- Road to Google Developers Certification
- UX / UI Design
- Web
- Web - AI for Web Developers
- Web - Browser Extensions
- Web - CSS & UI
- Web - DevTools & Browser Automation
- Web - Fugu/PWA APIs
- Web - Identity
- Web - Performance
- Workspace - Add Ons
- Workspace - AppSheet
- Workspace - Google Apps Script
- Workspace - Google Workspace (REST) APIs

## Rules that matter for the MCP

1. Send `Authorization: Bearer <token>` and `Content-Type: application/json` on every call.
2. Filter dates are ISO-8601 timestamps (`2026-01-01T00:00:00Z`). Activity dates in bodies are `YYYY-MM-DD`.
3. URLs must match `^https?://(www\.)?.*$`, max length 500.
4. `eventFormat`: `In-Person`, `Virtual`, `Hybrid`.
5. `GET /activities` query: `from`, `to`, `updatedAfter`, `page` (default 0), `size` (default 10, max 100). Sort is submission date ascending. Documented response field is `content` (array of `Activity`).
6. Activity `type` values: `content-creation`, `github-repository`, `interaction-with-googlers`, `mentoring`, `product-feedback-given`, `public-speaking`, `stories`, `workshop`, `youtube-video`.
7. Draft `POST` response: `{ "id": "<draft id>" }`.
8. Read models add `description_plain_text`, `additionalInfo_plain_text`, `imageUrl`, and sometimes `countryIso`, `city`, `cityPlaceId`, `cityState`. Those extra fields are not on the draft write bodies in this page.
9. `github-repository` read model: `labels` (max 50), `repositoryData` (`id`, `repository`, `owner`), metrics `stars`, `forks`, `watching`.
10. `youtube-video` read model: `videoData.id`, metrics `views`, `likes`, `comments`, `imageUrl` must be an http(s) URL.
