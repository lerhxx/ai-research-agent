# Event Protocol

# Travel Event Protocol

## TravelEvent

### TripStartedEvent 总启动事件

``` json
{
  "type": "trip.started",
  "tripId": "trip_123"
}
```
### RequirementParsedEvent 需求解析事件

``` josn
{
  "type": "trip.requirements",
  "data": {
    "destination": "Tokyo",
    "days": 5,
    "month": 10,
    "travelers": 2,
    "budget": "medium",
    "interests": [
      "food",
      "anime"
    ]
  }
}
```

### ResearchStartedEvent 研究启动事件

``` json
{
  "type": "research.started",
  "data": {
    "category": "attractions"
  }
}
```
### SearchStartEvent 搜索启动事件

``` json
{
  "type": "search.started",
  "data": {
    "query": "Tokyo anime attractions"
  }
}
```
### PlaceFoundEvent 候选地点事件

``` json
{
  "type": "place.found",
  "data": {
    "name": "Akihabara",
    "category": "anime",
    "reason": "符合用户动漫兴趣"
  }
}
```

### HotelFoundEvent 候选酒店事件
### FoodFoundEvent 候选美食事件
<!-- ### SearchResultEvent  搜索结果事件 -->

### ImageAnalysisStartEvent 图像识别启动事件

``` json
{
  "type": "image.analysis.started"
}
```

### ImageAnalysisEvent 图像识别事件

``` json
{
  "type": "image.analysis.progress",
  "data": {
    "message": "正在分析建筑、街道和地标特征"
  }
}
```

### ImageAnalysisResultEvent 图像识别结果事件
<!-- 支持地点、酒店、美食识别？ -->

``` json
{
  "type": "place.candidates",
  "data": {
    "places": [
      {
        "name": "浅草寺",
        "confidence": 0.87
      },
      {
        "name": "增上寺",
        "confidence": 0.08
      }
    ]
  }
}
```

### ImageAnalysisVerificationEvent 图像识别结果验证事件

``` json
{
  "type": "",
  "data": {
    "name": "浅草寺",
  }
}
```
### ItineraryDayStartedEvent 行程规划启动事件

``` json
{
  "type": "itinerary.day.started",
  "data": {
    "day": 1
  }
}
```
### ItineraryDeltaEvent 行程规划详情事件

``` json
{
  "type": "itinerary.delta",
  "data": {
    "day": 1,
    "text": "上午前往浅草寺..."
  }
}
```

```json
{
  "type": "itinerary.place",
  "data": {
    "day": 1,
    "place": "浅草寺",
    "time": "09:00"
  }
}
```
### CitationAddedEvent 溯源事件
### TripCompletedEvent; 总结束事件