/**
 * @jest-environment jsdom
 */

import {screen, waitFor, fireEvent} from "@testing-library/dom";

import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import {ROUTES} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import { bills } from "../fixtures/bills.js"
import mockStore from "../__mocks__/store.js";
import userEvent from "@testing-library/user-event";
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  beforeAll(() => {
    //set up the DOM & router
    Object.defineProperty(
      window, "localStorage",
      {value: localStorageMock}
    );
    localStorage.setItem("user", JSON.stringify({type: "Employee", email: "a@a"}));
  });

  //set up the html
  beforeEach(() => {
    const html = NewBillUI();
    document.body.innerHTML = html;
  });

  //clean up the html
  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("When I am on NewBill Page", () => {
    test("Then user should exist", () => {
      const user = JSON.parse(localStorage.getItem("user"));
      expect(user).toBeTruthy();
    });

    test("Then new bill page should be rendered", () => {
      const newBillTitle = screen.getByText("Envoyer une note de frais");
      expect(newBillTitle).toBeTruthy();
    });

    test("Then new bill page should contain a form", () => {
      const form = screen.getByTestId("form-new-bill");
      expect(form).toBeTruthy();
    });

    describe("When I upload a file", () => {
      beforeAll(() => {
        //set up the DOM & router
        Object.defineProperty(
          window, "localStorage",
          {value: localStorageMock}
        );
        localStorage.setItem("user", JSON.stringify({type: "Employee", email: "a@a"}));
      });

      afterEach(() => {
        document.body.innerHTML = "";
      });

      test("Then the file should be uploaded", () => {
        //set up the html
        document.body.innerHTML = NewBillUI();

        //import routeur
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({pathname});
        };

        //import container
        const instance = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        })

        //creates elements for assertions
        const file = new File(["test_file"], "test_file.png", {type: "image/png"});
        const input = screen.getByTestId("file");

        userEvent.upload(input, file);
        input.addEventListener("change", instance.handleChangeFile);
        fireEvent(input, new Event("change"));

        expect(screen.getByTestId("file").files[0].name).toBe("test_file.png");
      });

      test("Then the file should not be uploaded if the format is not correct", () => {
        //set up the html
        document.body.innerHTML = NewBillUI();

        //import routeur
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({pathname});
        };

        //import container
        const instance = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        })

        //creates elements for assertions
        const file = new File(["test_file"], "test_file.pdf", {type: "application/pdf"});
        const input = screen.getByTestId("file");

        //mock alert
        window.alert = jest.fn();

        userEvent.upload(input, file);
        input.addEventListener("change", instance.handleChangeFile);
        fireEvent(input, new Event("change"));

        //expect alert to be called
        expect(window.alert).toBeCalledWith("Le format de l'image n'est pas valide");
      });

      test("Then user should return to the bills page", async () => {
        //set up the html
        document.body.innerHTML = NewBillUI();

        //import routeur
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({pathname});
        };

        //import container
        const instance = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        })

        //Recreate user creating a new bill
        await waitFor(() => screen.getByTestId("file"));

        const file = new File(["test_file"], "test_file.png", {type: "image/png"});
        const input = screen.getByTestId("file");

        await userEvent.selectOptions(screen.getByTestId("expense-type"), "Restaurants et bars");
        await userEvent.type(screen.getByTestId("expense-name"), "test");
        await userEvent.type(screen.getByTestId("datepicker"), "2021-03-01");
        await userEvent.type(screen.getByTestId("amount"), "100");
        await userEvent.type(screen.getByTestId("vat"), "20");
        await userEvent.type(screen.getByTestId("pct"), "45");
        await userEvent.type(screen.getByTestId("commentary"), "test commentary");
        await userEvent.upload(input, file);

        //creates elements for assertions
        const form = screen.getByTestId("form-new-bill");
        const handleSubmit = jest.fn(instance.handleSubmit);
        form.addEventListener("submit", handleSubmit);
        fireEvent.submit(form);

        expect(handleSubmit).toHaveBeenCalled();
        expect(screen.getByText("Mes notes de frais")).toBeTruthy();
      });
    });

    // integration tests POST
    describe("Given I am a user connected as Employee", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(
          window, "localStorage",
          { value: localStorageMock }
        )
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })

      describe("When I am on NewBill Page", () => {
        test("Then API call POST should be called when i create a bill", async () => {
          const spy = jest.spyOn(mockStore, "bills");
          const newBill = {
            "id": "47qAXb6fIm2zOKkLzMro",
            "vat": "80",
            "fileUrl": "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
            "status": "pending",
            "type": "Hôtel et logement",
            "commentary": "séminaire billed",
            "name": "encore",
            "fileName": "preview-facture-free-201801-pdf-1.jpg",
            "date": "2004-04-04",
            "amount": 400,
            "commentAdmin": "ok",
            "email": "a@a",
            "pct": 20
          }

          const postCall = await mockStore.bills().update(newBill)

          expect(spy).toHaveBeenCalled();
          expect(postCall).toEqual(newBill);
        });
      });

      describe("When an error occurs on API", () => {
        test("Then bill create POST fails with 400 message error", async () => {
          const spy = jest.spyOn(mockStore.bills(), "create");

          spy.mockRejectedValue(new Error("400 error"));

          const postCallError = async () => {
            await mockStore.bills().create();
          }

          try {
            await postCallError();
          } catch (error) {
            //expect the error message to be "400 error"
            expect(error.message).toBe("400 error");
          }

          expect(spy).toHaveBeenCalled();
          spy.mockRestore();
        });

        test("Then bill update POST fails with 400 message error", async () => {
          const spy = jest.spyOn(mockStore.bills(), "update");

          spy.mockRejectedValue(new Error("400 error"));

          const postCallError = async () => {
            await mockStore.bills().update();
          }

          try {
            await postCallError();
          } catch (error) {
            //expect the error message to be "400 error"
            expect(error.message).toBe("400 error");
          }

          expect(spy).toHaveBeenCalled();
          spy.mockRestore();
        });

        test("Then bill create POST fails with 500 message error", async () => {
          const spy = jest.spyOn(mockStore.bills(), "create");

          spy.mockRejectedValue(new Error("500 error"));

          const postCallError = async () => {
            await mockStore.bills().create();
          }

          try {
            await postCallError();
          } catch (error) {
            //expect the error message to be "500 error"
            expect(error.message).toBe("500 error");
          }

          expect(spy).toHaveBeenCalled();
          spy.mockRestore();
        });

        test("Then bill update POST fails with 500 message error", async () => {
          const spy = jest.spyOn(mockStore.bills(), "update");

          spy.mockRejectedValue(new Error("500 error"));

          const postCallError = async () => {
            await mockStore.bills().update();
          }

          try {
            await postCallError();
          } catch (error) {
            //expect the error message to be "500 error"
            expect(error.message).toBe("500 error");
          }

          expect(spy).toHaveBeenCalled();
          spy.mockRestore();
        });
      });
    });
  });
})
