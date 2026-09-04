import React from 'react';
import Dragula from 'dragula';
import 'dragula/dist/dragula.css';
import Swimlane from './Swimlane';
import './Board.css';

export default class Board extends React.Component {

  constructor(props) {
    super(props);

    // At the beginning, we don't have the clients yet.
    // They will come from the backend.
    this.state = {
      clients: {
        backlog: [],
        inProgress: [],
        complete: [],
      }
    };

    this.swimlanes = {
      backlog: React.createRef(),
      inProgress: React.createRef(),
      complete: React.createRef(),
    };
  }


  // ==========================================================
  // GET CLIENTS FROM BACKEND
  // ==========================================================

  async componentDidMount() {

    try {

      // Ask the backend for all clients
      const response = await fetch(
        'http://localhost:3001/api/v1/clients'
      );

      const clients = await response.json();

      // Sort clients according to their priority
      clients.sort((a, b) => a.priority - b.priority);

      // Separate clients according to their status
      const backlogClients = clients.filter(
        client => client.status === 'backlog'
      );

      const inProgressClients = clients.filter(
        client => client.status === 'in-progress'
      );

      const completeClients = clients.filter(
        client => client.status === 'complete'
      );

      // Put the data received from the backend into React state
      this.setState({
        clients: {
          backlog: backlogClients,
          inProgress: inProgressClients,
          complete: completeClients,
        }
      });

    } catch (error) {

      console.error(
        'Error while fetching clients:',
        error
      );

    }


    // ========================================================
    // DRAGULA
    // ========================================================

    const drake = Dragula([
      this.swimlanes.backlog.current,
      this.swimlanes.inProgress.current,
      this.swimlanes.complete.current,
    ]);

    this.drake = drake;


    // ========================================================
    // WHEN A CARD IS DROPPED
    // ========================================================

    drake.on('drop', async (el, target, source) => {

      // Get the ID of the card
      const cardId = el.dataset.id;

      // ------------------------------------------------------
      // Determine the new status
      // ------------------------------------------------------

      let newStatus;

      if (target === this.swimlanes.backlog.current) {
        newStatus = 'backlog';

      } else if (target === this.swimlanes.inProgress.current) {
        newStatus = 'in-progress';

      } else if (target === this.swimlanes.complete.current) {
        newStatus = 'complete';
      }


      // ------------------------------------------------------
      // Determine the new priority
      // ------------------------------------------------------

      /*
       * target.children contains the cards in their
       * current visual order.
       *
       * index 0 = priority 1
       * index 1 = priority 2
       * index 2 = priority 3
       * ...
       */

      const cards = Array.from(target.children);

      const newPriority = cards.indexOf(el) + 1;


      // ------------------------------------------------------
      // Update the DOM color
      // ------------------------------------------------------

      el.classList.remove(
        'Card-grey',
        'Card-blue',
        'Card-green'
      );

      if (newStatus === 'backlog') {
        el.classList.add('Card-grey');

      } else if (newStatus === 'in-progress') {
        el.classList.add('Card-blue');

      } else if (newStatus === 'complete') {
        el.classList.add('Card-green');
      }


      // Update the status stored in the DOM
      el.dataset.status = newStatus;


      // ======================================================
      // SEND UPDATE TO BACKEND
      // ======================================================

      try {

        const response = await fetch(
          `http://localhost:3001/api/v1/clients/${cardId}`,
          {
            method: 'PUT',

            headers: {
              'Content-Type': 'application/json',
            },

            body: JSON.stringify({
              status: newStatus,
              priority: newPriority,
            }),
          }
        );


        if (!response.ok) {
          throw new Error(
            `Backend error: ${response.status}`
          );
        }


        console.log(
          'Card successfully updated:',
          cardId
        );

        console.log(
          'New status:',
          newStatus
        );

        console.log(
          'New priority:',
          newPriority
        );

      } catch (error) {

        console.error(
          'Error updating card:',
          error
        );

      }

    });
  }


  // ==========================================================
  // CLEANUP DRAGULA
  // ==========================================================

  componentWillUnmount() {

    if (this.drake) {
      this.drake.destroy();
    }

  }


  // ==========================================================
  // RENDER SWIMLANE
  // ==========================================================

  renderSwimlane(name, clients, ref) {

    return (
      <Swimlane
        name={name}
        clients={clients}
        dragulaRef={ref}
      />
    );
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  render() {

    return (
      <div className="Board">

        <div className="container-fluid">

          <div className="row">

            <div className="col-md-4">
              {this.renderSwimlane(
                'Backlog',
                this.state.clients.backlog,
                this.swimlanes.backlog
              )}
            </div>


            <div className="col-md-4">
              {this.renderSwimlane(
                'In Progress',
                this.state.clients.inProgress,
                this.swimlanes.inProgress
              )}
            </div>


            <div className="col-md-4">
              {this.renderSwimlane(
                'Complete',
                this.state.clients.complete,
                this.swimlanes.complete
              )}
            </div>

          </div>

        </div>

      </div>
    );
  }
}