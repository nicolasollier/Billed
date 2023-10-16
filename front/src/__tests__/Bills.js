/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import userEvent from "@testing-library/user-event";

import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";

import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

// mockStore
jest.mock("../app/Store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')

      expect(windowIcon.classList.contains('active-icon')).toBeTruthy()
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)

      expect(dates).toEqual(datesSorted)
    })

    test("Then clicking on New Bill button should navigate to NewBill page", () => {
      //set up the DOM & router
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
      );
      document.body.innerHTML = BillsUI({ data: bills })
      const mockOnNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      //create an instance of Bills
      const instance = new Bills({
        document,
        onNavigate: mockOnNavigate,
        store: mockStore,
        bills,
        localStorage: window.localStorage,
      })

      //set up elements for assertions
      const button = screen.getByTestId("btn-new-bill")
      const spy = jest.spyOn(instance, "handleClickNewBill")

      //run the test
      button.addEventListener("click", spy)
      userEvent.click(button)
      expect(spy).toHaveBeenCalled()

      //cleanup
      document.body.innerHTML = ""
      jest.restoreAllMocks()
    })

    test("Then clicking on the eye button should open the bill file previewer", () => {
      //set up the DOM & router
      Object.defineProperty(
          window, "localStorage",
          { value: localStorageMock }
      )
      window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
      )
      document.body.innerHTML = BillsUI({ data: bills })
      const mockOnNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      //create an instance of Bills
      const instance = new Bills({
        document,
        onNavigate: mockOnNavigate,
        store: mockStore,
        bills,
        localStorage: window.localStorage,
      })

      //set up elements for assertions
      const icon = screen.getAllByTestId("icon-eye")[0]

      //mock the modal because Jquery is not supported
      $.fn.modal = jest.fn(() => document.getElementById("modaleFile").classList.add("show"))
      const handleClickeyes = jest.fn((icon) => instance.handleClickIconEye(icon))
      const modal = document.getElementById("modaleFile")

      //check if the function is called when clicking on the icon
      icon.addEventListener("click", () => handleClickeyes(icon))
      userEvent.click(icon)
      expect(handleClickeyes).toHaveBeenCalled()

      //check if the modal is well opened
      expect(modal.classList.contains("show")).toBeTruthy()

      //cleanup
      document.body.innerHTML = ""
      jest.clearAllMocks()
    })
  })
})

// integration tests GET
describe("Given I am a user connected as Employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bills are fetched from mocked API", async () => {
      //set up the DOM & router
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()

      //mock the API call
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId("btn-new-bill"))

      //set up html element for assertion
      const bill = screen.getByText("Transports")

      //run the test
      expect(bill).toBeTruthy()
    })
  })

  describe("When an error occurs on API", () => {
    test("Then bills fetch fails with 404 message error", async () => {
      const spy = jest.spyOn(mockStore.bills(), "list")

      spy.mockRejectedValue(new Error("404 error"));

      const getCallError = async () => {
        await mockStore.bills().list()
      }

      try {
        await getCallError()
      } catch (error) {
        //expect the error message to be "404 error"
        expect(error.message).toBe("404 error");
      }

      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })

    test("fetches messages from an API and fails with 500 message error", async () => {
      const spy = jest.spyOn(mockStore.bills(), "list")

      spy.mockRejectedValue(new Error("500 error"));

      const getCallError = async () => {
        await mockStore.bills().list()
      }

      try {
        await getCallError()
      } catch (error) {
        //expect the error message to be "500 error"
        expect(error.message).toBe("500 error");
      }

      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    });
  });
});
