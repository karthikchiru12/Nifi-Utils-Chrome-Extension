# Nifi-Utils-Chrome-Extension
This extension eases the process of maintaining huge production nifi instances with numerous flows.

- This extension only works on Nifi instances that are deployed / productionized.
 
- When installed, it identifies when a logged-in Nifi instance is opened in the currently active tab in the browser. Then it inserts a content script, which retrieves the JWT (JSON Web Token) token and hostname from the currently active tab to the extension. 

- Then using that token and the instance`s hostname, the extension can retrieve a list of all the process groups present on the screen, bookmark any process group by adding them to the queue, and search for any process group.
 
- All the results by any of the features provided are cached to be viewed later. 

- The operation of getting the hostname and JWT token should be performed, whenever the user wants to fetch or search for new data or update existing data. 

- Once any process group is fetched/searched from any instance, it will be available to be searched from the chrome search itself indefinitely until the extension is uninstalled.


## Disclaimer

***The Software is provided "as is" without warranty of any kind, either express or implied. Use at your own risk.*** You can view the complete license under the LICENSE file in this repository.
