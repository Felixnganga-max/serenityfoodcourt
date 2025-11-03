I have this cafe management system, recording walk-in sales, outside catering sales, 
and having sales reports, there is also a dashboard, now, it's too generic, 

first, I need a role based auth system to check the logged in user, 
because there should be shop attendant (the person working on the shop, cooking and selling food, 
these could be multiple, but we start with one) second, vendor (could be multiple but we start with one also), 
and the Cafe owner/Manager, so, this is like the owner of the cafe, who will be managing the employees there,   
so, I need, so, for the  walk-in and outside catering, these are employees, they can sale, 
and see what they have sold, and that's that, also, they can see totals for the particular days they have sold, 
but they cannot see say yesterday sales, only for the current day they can feed the system what they have sold,   
the manager can see the inventory and sales reports, and all the walk and outside catering things, --- also, 
the manager can assign an individual from the walk-in and the outside catering to see like them 
(Add this because humans are humans, someone can get sick and ask for someone to handle for them 
like 2 days before they return), so can add and remove,,, Now, the manager can also set the foods sold 
and thier prices, and what will be saved into the database, so, they can add like categories and foods,
 categories are not compulsory, but they help group particular foods together like say drinks, snacks, 
 but its optional, so, they can decide prices and foods sold, second, they can change prices if they want,
  say when something goes up, ,, you get my idea. next, they need to be ale to group foods with related 
  cooking raw materials in order to see their grand total per particular period. This will be daily, 
  weekly, 2 weeks, 3 weeks, or a month. --- so, a user needs to select for what period first, then, 
  they can get like an analysis, but it needs to show daily by default, and then, if they for example 
  want to see Wheat-based Products, or potato based products, or drinks-based, then they select, apply 
  maybe a weekly filter, and see how many drinks were sold and the profit in that case, --- 
  aLL THESE WILL HAPPEN IN SALES ANALYSIS, --- next, there needs to be a place for putting expenses,
   so, lets say a user needs to know thier profit, so, they can add expenses for a day say like wages, 
   electricity, etc, let this be dynamic, but put there fixed and variable costs, for things like rent, 
   wages, have two options, so that they put them there, but in all occasions, dont hardcode, let the user
    themseleves add them, and for all, let them decide theperiod, because someone might subdivide their 
    rents between days, weeks, 2 weeks, etc, in order to see their profits in those periods,do you
     understand me

