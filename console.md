
committee.service.ts:59 
 GET http://localhost:8000/api/committees?event_id=0 404 (Not Found)
Promise.then		
getCommittees	@	committee.service.ts:59
calculateEventMetrics	@	event-metrics.service.ts:40
loadMetrics	@	event-metrics.service.ts:167
(anonymous)	@	event-metrics.service.ts:176
<OutletImpl>		
AuthenticatedLayout	@	authenticated-layout.tsx:39
<OutletImpl>		
component	@	__root.tsx:16
<RouterProvider>		
(anonymous)	@	main.tsx:96

{
    "message": "Request failed with status code 404",
    "name": "AxiosError",
    "stack": "AxiosError: Request failed with status code 404\n    at settle (http://localhost:5173/node_modules/.vite/deps/axios.js?v=c5cde93a:1257:12)\n    at XMLHttpRequest.onloadend (http://localhost:5173/node_modules/.vite/deps/axios.js?v=c5cde93a:1593:7)\n    at Axios.request (http://localhost:5173/node_modules/.vite/deps/axios.js?v=c5cde93a:2201:41)\n    at async CommitteeService.getCommittees (http://localhost:5173/src/services/committee.service.ts:19:26)\n    at async calculateEventMetrics (http://localhost:5173/src/services/event-metrics.service.ts:12:36)\n    at async loadMetrics (http://localhost:5173/src/services/event-metrics.service.ts:121:43)",
    "config": {
        "transitional": {
            "silentJSONParsing": true,
            "forcedJSONParsing": true,
            "clarifyTimeoutError": false
        },
        "adapter": [
            "xhr",
            "http",
            "fetch"
        ],
        "transformRequest": [
            null
        ],
        "transformResponse": [
            null
        ],
        "timeout": 0,
        "xsrfCookieName": "XSRF-TOKEN",
        "xsrfHeaderName": "X-XSRF-TOKEN",
        "maxContentLength": -1,
        "maxBodyLength": -1,
        "env": {},
        "headers": {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwMDAvYXBpL2F1dGgvbG9naW4iLCJpYXQiOjE3NjE3ODc1NTksImV4cCI6MTc2MTc5MTE1OSwibmJmIjoxNzYxNzg3NTU5LCJqdGkiOiJsV0Q3WGlhWndybEtCcWtHIiwic3ViIjoiMyIsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjciLCJyb2xlIjoic2VlZGJlZF9sZWFkZXIiLCJwZXJtaXNzaW9ucyI6WyJkYXNoYm9hcmQudmlldyIsImV2ZW50cy52aWV3IiwiZXZlbnRzLnBhcnRpY2lwYXRlIiwidGFza3MudmlldyIsInRhc2tzLmNvbXBsZXRlIiwidGFza3MucmVwb3J0X3Byb2dyZXNzIiwiZXZlbnRzLnRhc2tzLnZpZXciLCJldmVudHMudGFza3Mudmlld19hc3NpZ25lZCIsImV2ZW50cy50YXNrcy5jb21wbGV0ZSIsImV2ZW50cy50YXNrcy5yZXBvcnRfcHJvZ3Jlc3MiLCJpbmNpZGVudHMudmlldyIsImluY2lkZW50cy5jcmVhdGUiLCJldmVudHMuaW5jaWRlbnRzLnZpZXciLCJldmVudHMuaW5jaWRlbnRzLnJlcG9ydCIsImFsZXJ0cy52aWV3IiwiZXZlbnRzLmFsZXJ0cy52aWV3Iiwic2VlZGJlZF9sZWFkZXIuZGFzaGJvYXJkLnZpZXciLCJzZWVkYmVkX2xlYWRlci5zZWVkYmVkLnZpZXciLCJzZWVkYmVkX2xlYWRlci5zZWVkYmVkLmVkaXQiLCJzZWVkYmVkX2xlYWRlci5wcm9qZWN0cy52aWV3Iiwic2VlZGJlZF9sZWFkZXIucHJvamVjdHMuY3JlYXRlIiwic2VlZGJlZF9sZWFkZXIucHJvamVjdHMuZWRpdCIsInNlZWRiZWRfbGVhZGVyLnByb2plY3RzLmRlbGV0ZSIsInNlZWRiZWRfbGVhZGVyLm1lbWJlcnMubWFuYWdlIiwicHJvZmlsZS52aWV3IiwicHJvZmlsZS5lZGl0Iiwibm90aWZpY2F0aW9ucy52aWV3Il19.-cnpVihUm8aqhon30TP4xnrgMN7lb2nZv4efrYEwDP0"
        },
        "baseURL": "http://localhost:8000/api",
        "params": {
            "event_id": 0
        },
        "method": "get",
        "url": "/committees",
        "allowAbsoluteUrls": true
    },
    "code": "ERR_BAD_REQUEST",
    "status": 404
}