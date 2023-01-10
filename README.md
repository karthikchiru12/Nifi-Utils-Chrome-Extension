# Nifi-Utils-Chrome-Extension
Manage your production Nifi instances like a pro.

- This extension only works on Nifi instances that are deployed / productionized.
 
- When a logged-in Nifi instance is opened in the currently active tab, the extension injects a content script in that tab, which retrieves the JWT (JSON Web Token) token and hostname of the Nifi instance from the currently active tab to the extension. 

- Then using that token and the instance`s hostname, the extension can retrieve all the process groups present on the Nifi canvas. And they are also cached to view later. Then you can search & sort the fetched process groups based on various filters. You can also bookmark any process group by adding it to the queue. And export the queue as a CSV file.

- Apart from fetching only what is available on the canvas, you can also search for process groups in the whole Nifi instance. And these search results are also cached to be viewed later.

- Once any process group is fetched from canvas/searched for, it will available to be directly searched from chrome`s search bar.

- Anyone working on Nifi 1.13.2 or less can leverage various custom UI components which are directly injected into the Nifi UI. They can help you in enabling/disabling all the controller services at a certain process group level, copy the JWT token using a single click, and back up any of the process groups to your google drive. You can enable any of these custom UI components using the options menu.


## Disclaimer

***The Software is provided "as is" without warranty of any kind, either express or implied. Use at your own risk.*** You can view the complete license under the LICENSE file in this repository.
