define([ 
    "backbone", 
    "handlebars", 
    "data_list/DataList",
    "data_list/DataListEditView",
    "datum/Datum",
    "datum/Datums",
    "datum/DatumFieldEditView",
    "search/Search",
    "app/UpdatingCollectionView",
    "libs/Utils"
], function(
    Backbone, 
    Handlebars, 
    DataList,
    DataListEditView,
    Datum,
    Datums,
    DatumFieldEditView,
    Search,
    UpdatingCollectionView
) {
  var SearchEditView = Backbone.View.extend(
  /** @lends SearchEditView.prototype */
  {
    /**
     * @class Search View handles the render of the global search in the corner,
     *        and the advanced power search, as well as their events.
     * 
     * @property {String} format Valid values are "fullscreen", "top", or "centreWell" 
     * 
     * @description Starts the Search.
     * 
     * @extends Backbone.View
     * @constructs
     */
    initialize : function() {
      Utils.debug("SEARCH init: " + this.el);
      
      this.newTempDataList();
      this.changeViewsOfInternalModels();

      this.model.bind('change', this.render, this);
    },
    
    /**
     * The underlying model of the SearchEditView is a Search.
     */
    model : Search,
    
    /**
     * Events that the SearchEditView is listening to and their handlers.
     */
    events : {
      "click .btn-search-union" : "searchUnion",
      "click .btn-search-intersection" : "searchIntersection",
      "click .icon-search" : "searchTop",
      "click .icon-resize-small" : "resizeSmall",
      "click .icon-resize-full" : 'resizeFullscreen',
      "click .btn-advanced-search" : "resizeSmall",
      "keyup #search_box" : function(e) {
        var code = e.keyCode || e.which;
        
        // code == 13 is the enter key
        if (code == 13) {
          this.searchTop();
        }
      }
    },
    
    /**
     * The Handlebars template rendered as the embedded AdvancedSearchView.
     */
    embeddedTemplate : Handlebars.templates.search_advanced_edit_embedded,
    
    /**
     * The Handlebars template rednered as the fullscreen AdvancedSearchView.
     */
    fullscreenTemplate : Handlebars.templates.search_advanced_edit_fullscreen,
    
    /**
     * The Handlebars template rendered as the TopSearchView.
     */
    topTemplate : Handlebars.templates.search_edit_embedded,
   
    /**
     * Renders the SearchEditView.
     */
    render : function() {
      Utils.debug("SEARCH render: " + this.el);
      //make sure the datum fields and session fields match the current corpus
      this.changeViewsOfInternalModels();

      if (this.format == "fullscreen") {
        // Display the SearchView
        this.setElement($("#search-fullscreen"));
        $(this.el).html(this.fullscreenTemplate(this.model.toJSON()));
        

        this.advancedSearchDatumView.el = this.$('.advanced_search_datum');
        this.advancedSearchDatumView.render();

        this.advancedSearchSessionView.el = this.$('.advanced_search_session');
        this.advancedSearchSessionView.render();
      } else if (this.format == "centreWell") {
        // Display the SearchView
        this.setElement($("#search-embedded"));
        $(this.el).html(this.embeddedTemplate(this.model.toJSON()));
        

        this.advancedSearchDatumView.el = this.$('.advanced_search_datum');
        this.advancedSearchDatumView.render();

        this.advancedSearchSessionView.el = this.$('.advanced_search_session');
        this.advancedSearchSessionView.render();
      } else if (this.format == "top") {
        // Display the SearchView
        this.setElement($("#search-top"));
        $(this.el).html(this.topTemplate(this.model.toJSON()));
      }
      
      if(this.format == "top"){
        try{
          if(!this.searchDataListEditLeftSideView.format){
            this.searchDataListEditLeftSideView.format = "search-minimized";
          }
//      this.searchDataListEditLeftSideView.format = "search";
          this.searchDataListEditLeftSideView.render();
        }catch(e){
          Utils.debug("Trying to set the searchDataListEditLeftSideView too early.");
//          var self = this;
//          newTempDataList(function(){ 
//            self.render();
//          }); //dont need this eventually it shows up
        }
      }

      return this;
    },
    newTempDataList : function(callback){
      //Only do this if it is the top search. otherwise it seems that all three search edit views are making a data list, and their three data lists are listening to the same events and doing them three times, which migh tmean we g will get three resulting saved ata lsits if the user pushes save?
      if(this.format == "top"){
        this.searchDataListEditLeftSideView = new DataListEditView({
          model : new DataList(),
          datumCollection : new Datums() 
        }); 
        this.searchDataListEditLeftSideView.model.set("title","Temporary Search Results");
        this.searchDataListEditLeftSideView.model.set("description","You can use search to create data lists for handouts.");
        this.searchDataListEditLeftSideView.model.set("corpusname", window.app.get("corpus").get("corpusname"));
        this.searchDataListEditLeftSideView.format = "search-minimized";
        if(typeof callback == "function"){
          callback();
        }
      }
    },
    changeViewsOfInternalModels : function(){
      
      //TODO, why clone? with clones they are never up to date with what is in the corpus.
      this.advancedSearchDatumView = new UpdatingCollectionView({
        collection           : window.app.get("corpus").get("datumFields"),
        childViewConstructor : DatumFieldEditView,
        childViewTagName     : 'li',
        childViewFormat      : "datum"
      });
      
      this.advancedSearchSessionView = new UpdatingCollectionView({
        collection           : window.app.get("corpus").get("sessionFields"),
        childViewConstructor : DatumFieldEditView,
        childViewTagName     : 'li',
        childViewFormat      : "session"
      });
      
    },
    /**
     * Perform a search that finds the union of all the criteria.
     */
    searchUnion : function() {
      Utils.debug("In searchUnion");
      
      // Create a query string from the search criteria
      var queryString = this.getQueryString("union");
      
      // Update the search box
      appView.searchTopView.model.set("searchKeywords", queryString);
      
      // Start the search
      this.search(queryString);
    },
    
    /**
     * Perform a search that finds the intersection of all the criteria.
     */
    searchIntersection : function() {
      Utils.debug("In searchIntersection");
      
      // Create a query string from the search criteria
      var queryString = this.getQueryString("intersection");
      
      // Update the search box
      appView.searchTopView.model.set("searchKeywords", queryString);
      
      // Start the search
      this.search(queryString);
    },
    
    /**
     * Perform a search.
     */
    searchTop : function() {
      Utils.debug("Will search for " + $("#search_box").val());
      this.model.set("searchKeywords", $("#search_box").val());
            // Search for Datum that match the search criteria      
      var allDatumIds = [];
      this.search($("#search_box").val());
      
    },
    
    
    /**
     * Create a string representation of the search criteria. Each
     * Object's key is the datum field's label and its value is the datum
     * field's value (i.e the search criteria). An example object would be
     *  {
     *    utterance : "searchForThisUtterance",
     *    gloss : "searchForThisGloss",
     *    translation : "searchForThisTranslation"
     *  }
     * 
     * @return {Object} The created query object.
     */
    getQueryString : function(type) {      
      // All the search fields related to Datum
      var datumFieldsViews = this.advancedSearchDatumView.collection;
      var sessionFieldsView = this.advancedSearchSessionView.collection;
      
      // Get all the search criteria
      var searchCriteria = [];
      datumFieldsViews.each(function(datumField) {
        var value = datumField.get("mask");
        if (value && value != "") {
          searchCriteria.push(datumField.get("label") + ":" + value);
        }
      });
      sessionFieldsView.each(function(sessionField) {
        var value = sessionField.get("mask");
        if (value && value != "") {
          searchCriteria.push(sessionField.get("label") + ":" + value);
        }
      });
      
      // Update the search box with the search string corresponding to the
      // current search criteria
      var queryString = "";
      if (type == "union") {
        queryString = searchCriteria.join(" OR ");
      } else if (type == "intersection") {
        queryString = searchCriteria.join(" AND ");
      }
      
      Utils.debug("Searching for " + queryString);
      return queryString;
    },
    
    /**
     * Perform a search that finds either the union or the intersection or all
     * the criteria.
     * 
     * @param queryString {String} The string representing the query.
     */
    search : function(queryString) {
      // Search for Datum that match the search criteria      
      var searchself = this;
      (new Datum({"corpusname": app.get("corpus").get("corpusname")})).searchByQueryString(queryString
          , function(datumIds){
        //this will take in matchIds from its caller
        // Create a new temporary data list in editable datalist on the LeftSide
        if(searchself.format != "top"){
          searchself = window.appView.searchTopView;
//          return; //dont try to put dat in unless you have a data list, and its the centerwell one who controls the temp serach results
        }
        searchself.newTempDataList(function(){
          searchself.searchDataListEditLeftSideView.model.set("title"
              , $("#search_box").val()
              + " search result");
          searchself.searchDataListEditLeftSideView.model.set("description"
              ,  "This is the result of searching for : " 
              + $("#search_box").val()
              + " in " 
              + window.app.get("corpus").get("title") 
              + " on "+ JSON.stringify(new Date()) );
          searchself.searchDataListEditLeftSideView.format = "search";
          searchself.searchDataListEditLeftSideView.render();
          // Add search results to the data list
          for (var key in datumIds) {
            searchself.searchDataListEditLeftSideView.addOneDatumId(datumIds[key]);
            Utils.debug("Successfully got data back from search and put it into the temp search data list");
          }
        });
      });
      
//    }catch(e){
//      alert("Bug: There was a problem searching. it might be that your computer didnt pull down the files from the server that it needs to search. this has to happen once before search will work. ");
//    }
    },
    
    searchContinued : function(datumIds) {
     //put in to the search function to get the context of the proper seracheditview
    },
    
    /**
     * Initialize the sample Search.
     */
    loadSample : function() {
      this.model.set({
        searchKeywords : "naya"
      });
    },
      
    resizeSmall : function(){
      window.app.router.showEmbeddedSearch();
    },
    
    resizeFullscreen : function(){
      window.app.router.showFullscreenSearch();
    }
  });

  return SearchEditView;
});